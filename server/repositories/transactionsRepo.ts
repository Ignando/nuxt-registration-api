import { getDb, TxnFilters } from '../utils/db'

export type Transaction = {
    id?: number
    utility_type: 'water' | 'electricity' | 'gas'
    amount: number
    complex_id: number
    meter_number?: string
    owner_id?: number
    date: string // ISO
}

export function listTransactions(filters: TxnFilters) {
    const db = getDb()
    const where: string[] = []
    const params: any = {}
    if (filters.utility_type) { where.push('utility_type = @utility_type'); params.utility_type = filters.utility_type }
    if (filters.min_amount != null) { where.push('amount > @min_amount'); params.min_amount = filters.min_amount }
    if (filters.max_amount != null) { where.push('amount < @max_amount'); params.max_amount = filters.max_amount }
    if (filters.complex_id) { where.push('complex_id = @complex_id'); params.complex_id = filters.complex_id }
    if (filters.owner_id) { where.push('owner_id = @owner_id'); params.owner_id = filters.owner_id }
    if (filters.meter_search) { where.push('meter_number LIKE @meter'); params.meter = `%${filters.meter_search}%` }
    if (filters.date_from) { where.push("date(datetime(date)) >= date(datetime(@date_from))"); params.date_from = filters.date_from }
    if (filters.date_to) { where.push("date(datetime(date)) <= date(datetime(@date_to))"); params.date_to = filters.date_to }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const limit = filters.limit ?? 100
    const offset = filters.offset ?? 0
    const sql = `SELECT * FROM transactions ${clause} ORDER BY datetime(date) DESC LIMIT ${limit} OFFSET ${offset}`
    return db.prepare(sql).all(params)
}

export function insertTransaction(t: Transaction) {
    const db = getDb()
    const stmt = db.prepare(`INSERT INTO transactions (utility_type, amount, complex_id, meter_number, owner_id, date) VALUES (@utility_type,@amount,@complex_id,@meter_number,@owner_id,@date)`)
    const info = stmt.run(t)
    return info.lastInsertRowid
}

export function updateTransaction(id: number, t: Partial<Transaction>) {
    const db = getDb()
    const fields: string[] = []
    const params: any = { id }
    for (const k of ['utility_type', 'amount', 'complex_id', 'meter_number', 'owner_id', 'date'] as const) {
        if (t[k] !== undefined) { fields.push(`${k}=@${k}`); (params as any)[k] = t[k] }
    }
    if (!fields.length) return 0
    const sql = `UPDATE transactions SET ${fields.join(', ')}, updated_at=datetime('now') WHERE id=@id`
    return db.prepare(sql).run(params).changes
}

export function totalsByUtility(filters: TxnFilters) {
    const db = getDb()
    const base = listTransactions(filters)
    const total = base.reduce((a: any, r: any) => { a.all += r.amount; a[r.utility_type] = (a[r.utility_type] || 0) + r.amount; return a }, { all: 0, water: 0, electricity: 0, gas: 0 })
    return total
}

export function totalsByOwner(filters: TxnFilters) {
    const db = getDb()
    // Build WHERE similarly to listTransactions but aggregated by owner
    const where: string[] = []
    const params: any = {}
    if (filters.utility_type) { where.push('t.utility_type = @utility_type'); params.utility_type = filters.utility_type }
    if (filters.min_amount != null) { where.push('t.amount > @min_amount'); params.min_amount = filters.min_amount }
    if (filters.max_amount != null) { where.push('t.amount < @max_amount'); params.max_amount = filters.max_amount }
    if (filters.complex_id) { where.push('t.complex_id = @complex_id'); params.complex_id = filters.complex_id }
    if (filters.owner_id) { where.push('t.owner_id = @owner_id'); params.owner_id = filters.owner_id }
    if (filters.meter_search) { where.push('t.meter_number LIKE @meter'); params.meter = `%${filters.meter_search}%` }
    if (filters.date_from) { where.push("date(datetime(t.date)) >= date(datetime(@date_from))"); params.date_from = filters.date_from }
    if (filters.date_to) { where.push("date(datetime(t.date)) <= date(datetime(@date_to))"); params.date_to = filters.date_to }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const sql = `
    SELECT o.id as owner_id, o.name as owner_name, SUM(t.amount) as total
    FROM transactions t LEFT JOIN owners o ON o.id = t.owner_id
    ${clause}
    GROUP BY o.id, o.name
    ORDER BY total DESC
  `
    return db.prepare(sql).all(params)
}

export function totalsByComplex(filters: TxnFilters) {
    const db = getDb()
    const where: string[] = []
    const params: any = {}
    if (filters.utility_type) { where.push('t.utility_type = @utility_type'); params.utility_type = filters.utility_type }
    if (filters.min_amount != null) { where.push('t.amount > @min_amount'); params.min_amount = filters.min_amount }
    if (filters.max_amount != null) { where.push('t.amount < @max_amount'); params.max_amount = filters.max_amount }
    if (filters.complex_id) { where.push('t.complex_id = @complex_id'); params.complex_id = filters.complex_id }
    if (filters.owner_id) { where.push('t.owner_id = @owner_id'); params.owner_id = filters.owner_id }
    if (filters.meter_search) { where.push('t.meter_number LIKE @meter'); params.meter = `%${filters.meter_search}%` }
    if (filters.date_from) { where.push("date(datetime(t.date)) >= date(datetime(@date_from))"); params.date_from = filters.date_from }
    if (filters.date_to) { where.push("date(datetime(t.date)) <= date(datetime(@date_to))"); params.date_to = filters.date_to }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const sql = `
    SELECT c.id as complex_id, c.name as complex_name, SUM(t.amount) as total
    FROM transactions t LEFT JOIN complexes c ON c.id = t.complex_id
    ${clause}
    GROUP BY c.id, c.name
    ORDER BY total DESC
  `
    return db.prepare(sql).all(params)
}