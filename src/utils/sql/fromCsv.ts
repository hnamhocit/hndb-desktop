import Papa from 'papaparse'

import { buildInsertSqlFromRows } from './index'

export const generateInsertSqlFromCsv = (
	file: File,
	tableName: string,
	onSuccess: (sql: string) => void,
): void => {
	Papa.parse(file, {
		header: true,
		skipEmptyLines: true,
		complete: (results) => {
			const data = results.data as Record<string, unknown>[]

			if (!data.length) {
				alert('File CSV trống!')
				return
			}

			const sql = buildInsertSqlFromRows({
				tableName,
				rows: data,
			})

			onSuccess(sql)
		},
		error: (err) => {
			console.error('Parse CSV failed:', err)
		},
	})
}
