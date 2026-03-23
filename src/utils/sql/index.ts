import { DataSourceType } from '@/schemas'

const unquoteIdentifierSegment = (value: string) =>
	value.trim().replace(/^[`"'\[]+/, '').replace(/[`"'\]]+$/, '')

const escapeIdentifierSegment = (
	identifier: string,
	dialect: DataSourceType,
): string => {
	switch (dialect) {
		case 'mysql':
		case 'mariadb':
			return `\`${identifier.replace(/`/g, '``')}\``
		case 'mssql':
			return `[${identifier.replace(/]/g, ']]')}]`
		case 'postgres':
		case 'sqlite':
		default:
			return `"${identifier.replace(/"/g, '""')}"`
	}
}

const serializeStructuredValue = (value: Record<string, unknown> | unknown[]) =>
	JSON.stringify(value, (_, nestedValue) =>
		typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
	)

export const escapeSqlIdentifier = (
	identifier: string,
	dialect: DataSourceType,
): string => {
	return identifier
		.split('.')
		.map(unquoteIdentifierSegment)
		.filter(Boolean)
		.map((segment) => escapeIdentifierSegment(segment, dialect))
		.join('.')
}

export const formatSqlCsvImportValue = (
	val: unknown,
	dialect: DataSourceType,
): string => {
	if (val === null || val === undefined || val === '') return 'NULL'

	if (typeof val === 'number') {
		return Number.isFinite(val) ? String(val) : 'NULL'
	}

	if (typeof val === 'bigint') {
		return val.toString()
	}

	if (typeof val === 'boolean') {
		return dialect === 'mssql' ? (val ? '1' : '0') : (
			val ? 'TRUE'
			: 'FALSE'
		)
	}

	if (val instanceof Date) {
		return `'${val.toISOString().replace(/'/g, "''")}'`
	}

	if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
		return `'${serializeStructuredValue(
			val as Record<string, unknown> | unknown[],
		).replace(/'/g, "''")}'`
	}

	const strVal = String(val)

	if (strVal.trim() === '') return 'NULL'

	return `'${strVal.replace(/'/g, "''")}'`
}

interface BuildInsertSqlFromRowsParams {
	tableName: string
	rows: Record<string, unknown>[]
	dialect: DataSourceType
	columns?: string[]
	chunkSize?: number
}

export const buildInsertSqlFromRows = ({
	tableName,
	rows,
	dialect,
	columns,
	chunkSize = 1000,
}: BuildInsertSqlFromRowsParams): string => {
	if (!rows.length) return ''

	const resolvedColumns =
		columns?.filter(Boolean) ??
		Array.from(
			new Set(rows.flatMap((row) => Object.keys(row))),
		)

	if (!resolvedColumns.length) return ''

	const escapedTableName = escapeSqlIdentifier(tableName, dialect)
	const columnsString = resolvedColumns
		.map((column) => escapeSqlIdentifier(column, dialect))
		.join(', ')

	const valuesArray = rows.map((row) => {
		const rowValues = resolvedColumns.map((col) =>
			formatSqlCsvImportValue(row[col] ?? null, dialect),
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
