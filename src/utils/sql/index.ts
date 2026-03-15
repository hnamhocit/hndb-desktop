export const escapeSqlIdentifier = (identifier: string): string => {
	return `\`${identifier.replace(/`/g, '``')}\``
}

export const formatSqlCsvImportValue = (val: unknown): string => {
	if (val === null || val === undefined || val === '') return 'NULL'

	if (typeof val === 'number') {
		return Number.isFinite(val) ? String(val) : 'NULL'
	}

	if (typeof val === 'boolean') {
		return val ? '1' : '0'
	}

	const strVal = String(val).trim()

	if (strVal === '') return 'NULL'
	if (strVal === '1' || strVal === '0') return strVal
	if (strVal.toLowerCase() === 'true') return '1'
	if (strVal.toLowerCase() === 'false') return '0'

	return `'${strVal.replace(/'/g, "''")}'`
}

interface BuildInsertSqlFromRowsParams {
	tableName: string
	rows: Record<string, unknown>[]
	chunkSize?: number
}

export const buildInsertSqlFromRows = ({
	tableName,
	rows,
	chunkSize = 1000,
}: BuildInsertSqlFromRowsParams): string => {
	if (!rows.length) return ''

	const columns = Object.keys(rows[0])
	const escapedTableName = escapeSqlIdentifier(tableName)
	const columnsString = columns.map(escapeSqlIdentifier).join(', ')

	const valuesArray = rows.map((row) => {
		const rowValues = columns.map((col) =>
			formatSqlCsvImportValue(row[col]),
		)
		return `(${rowValues.join(', ')})`
	})

	const statements: string[] = []

	for (let i = 0; i < valuesArray.length; i += chunkSize) {
		const chunk = valuesArray.slice(i, i + chunkSize)
		statements.push(
			`INSERT INTO ${escapedTableName} (${columnsString}) VALUES\n${chunk.join(',\n')};`,
		)
	}

	return statements.join('\n\n')
}
