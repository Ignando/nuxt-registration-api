import { H3Event, readMultipartFormData } from 'h3'
import * as XLSX from 'xlsx'
import database from '../utils/db'

interface meter_transactions {
    date_time: string
    meter_number: number
    token: number
    utility_type: string
    complex: string
    value_of_purchase: number
    owner_id: string
}

export default defineEventHandler(async (event: H3Event) => {
    const formData = await readMultipartFormData(event)
    const file = formData?.find(f => f.name === 'file')

    if (!file || !file.data) {
        return {
            success: false,
            message: 'No file uploaded',
        }
    }

    // ✅ Parse directly from buffer
    const workbook = XLSX.read(file.data, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const transactions: meter_transactions[] = XLSX.utils.sheet_to_json(sheet)

    let inserted = 0
    let skipped = 0

    for (const transaction of transactions) {
        if (
            !transaction.date_time ||
            !transaction.meter_number ||
            !transaction.token ||
            !transaction.utility_type ||
            !transaction.complex ||
            !transaction.value_of_purchase ||
            !transaction.owner_id
        ) {
            skipped++
            continue
        }

        // Optional: Add duplicate check here before inserting
        try {
            database.prepare(`
        INSERT INTO meter_transactions (
          date_time, meter_number, token, utility_type, complex, value_of_purchase, owner_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
                transaction.date_time,
                transaction.meter_number,
                transaction.token,
                transaction.utility_type,
                transaction.complex,
                transaction.value_of_purchase,
                transaction.owner_id
            )
            inserted++
        } catch (err) {
            console.error('DB insert error:', err)
            skipped++
        }
    }

    return {
        success: true,
        message: `File processed`,
        inserted,
        skipped,
    }
})
