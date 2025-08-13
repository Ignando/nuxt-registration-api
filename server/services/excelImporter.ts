import * as XLSX from 'xlsx'
import { getDb } from '../utils/db'

export type ImportResult = {
    success: boolean
    summary: any
    warnings: any[]
    errors: any[]
    sample: any[]
    upsert_key: 'composite'
    import_id: string
}

function iso(input: any): string | null {
    if (input == null || input === '') return null
    if (typeof input === 'number') {
        const epoch = XLSX.SSF.parse_date_code(input)
        if (!epoch) return null
        const d = new Date(Date.UTC(epoch.y, (epoch.m || 1) - 1, epoch.d || 1, epoch.H || 0, epoch.M || 0, Math.floor(epoch.S || 0)))
        return d.toISOString()
    }
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function importTransactionsXlsx(opts: { buffer: Buffer, sheet?: string, dry_run?: boolean }): Promise<ImportResult> {
    const started = new Date().toISOString()
    const wb = XLSX.read(opts.buffer, { type: 'buffer' })
    const wsName = opts.sheet || wb.SheetNames[0]
    const ws = wb.Sheets[wsName]
    if (!ws) throw new Error('Sheet not found')

    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })
    const warnings: any[] = []
    const errors: any[] = []
    const parsed: any[] = []

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const rowNo = i + 2 // header at row 1
        const rec = {
            utility_type: String(r['Utility'] || r['utility'] || '').toLowerCase(),
            amount: Number(String(r['Amount'] || r['amount'] || '').toString().replace(/[,\s]/g, '')),
            complex: String(r['Complex'] || r['complex'] || '').trim(),
            owner: String(r['Owner'] || r['owner'] || '').trim(),
            meter_number: String(r['Meter'] || r['meter'] || r['Meter Number'] || '').trim(),
            date: iso(r['Date'] || r['date'])
        }
        if (!rec.utility_type || !['water', 'electricity', 'gas'].includes(rec.utility_type)) { errors.push({ row: rowNo, column: 'Utility', message: 'Required/invalid' }); continue }
        if (!isFinite(rec.amount) || rec.amount <= 0) { errors.push({ row: rowNo, column: 'Amount', message: 'Invalid' }); continue }
        if (!rec.complex) { errors.push({ row: rowNo, column: 'Complex', message: 'Required' }); continue }
        if (!rec.date) { errors.push({ row: rowNo, column: 'Date', message: 'Invalid/required' }); continue }
        parsed.push({ ...rec })
    }

    // dedupe within file: composite key (date, complex, meter_number, amount, utility_type)
    const seen = new Set<string>()
    const unique = parsed.filter((r: any, idx: number) => {
        const key = `${r.date}|${r.complex}|${r.meter_number}|${r.amount}|${r.utility_type}`
        if (seen.has(key)) { warnings.push({ row: idx + 2, message: 'Duplicate row within file — skipped' }); return false }
        seen.add(key); return true
    })

    const db = getDb()
    let inserted = 0, updated = 0, failed = errors.length

    if (!opts.dry_run) {
        const insertTxn = db.transaction(() => {
            for (const r of unique) {
                // resolve owner/complex
                let owner_id: number | null = null
                if (r.owner) {
                    const fo = db.prepare('SELECT id FROM owners WHERE name=?')
                        .pluck()
                        .get(r.owner) as number | undefined

                    owner_id = fo ?? Number(
                        db.prepare('INSERT INTO owners(name) VALUES(?)').run(r.owner).lastInsertRowid
                    )
                }
                const fcId = db
                    .prepare('SELECT id FROM complexes WHERE name=? AND ifnull(owner_id,0)=ifnull(?,0)')
                    .pluck()
                    .get(r.complex, owner_id ?? null) as number | undefined;

                const complex_id = fcId ?? Number(
                    db.prepare('INSERT INTO complexes(name, owner_id) VALUES(?,?)')
                        .run(r.complex, owner_id ?? null).lastInsertRowid
                );

                // check duplicate in DB using composite key
                const dup = db.prepare(`SELECT id FROM transactions WHERE utility_type=? AND amount=? AND complex_id=? AND ifnull(meter_number,'')=ifnull(?, '') AND date=?`).get(r.utility_type, r.amount, complex_id, r.meter_number || null, r.date)
                if (dup) { warnings.push({ message: 'Duplicate in DB — skipped', composite: { complex: r.complex, meter: r.meter_number, amount: r.amount, utility: r.utility_type, date: r.date } }); continue }

                db.prepare(`INSERT INTO transactions(utility_type, amount, complex_id, meter_number, owner_id, date) VALUES(?,?,?,?,?,?)`).run(r.utility_type, r.amount, complex_id, r.meter_number || null, owner_id, r.date)
                inserted++
            }
        })
        insertTxn()
    }

    const finished = new Date().toISOString()
    const res: ImportResult = {
        success: errors.length === 0,
        summary: {
            rows_received: rows.length,
            rows_valid: parsed.length,
            inserted,
            updated,
            failed,
            dry_run: !!opts.dry_run,
            sheet: wsName,
            duration_ms: Date.parse(finished) - Date.parse(started)
        },
        warnings,
        errors,
        sample: unique.slice(0, 3),
        upsert_key: 'composite',
        import_id: `imp_${Date.now()}`
    }

    // store import record
    try {
        getDb().prepare(`INSERT OR REPLACE INTO imports(import_id, filename, sheet, started_at, finished_at, rows_received, inserted, updated, failed, dry_run, report_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(
            res.import_id, 'upload.xlsx', wsName, started, finished, rows.length, inserted, updated, failed, opts.dry_run ? 1 : 0, JSON.stringify({ warnings, errors })
        )
    } catch { }

    return res
}