import Papa from 'papaparse'

import { buildInsertSqlFromRows } from './index'

export const generateInsertSqlFromCsv = (
	file: File,
	tableName: string,
	onSuccess: (sql: string) => void,
	onError?: (errorCode: 'EMPTY_CSV' | 'PARSE_FAILED') => void,
): void => {
	Papa.parse(file, {
		header: true,
		skipEmptyLines: true,
		complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
			const data = results.data as Record<string, unknown>[]

			if (!data.length) {
				onError?.('EMPTY_CSV')
				return
			}

			const sql = buildInsertSqlFromRows({
				tableName,
				rows: data,
			})

			onSuccess(sql)
		},
		error: (err: Error) => {
			console.error('Parse CSV failed:', err)
			onError?.('PARSE_FAILED')
		},
	})
}
