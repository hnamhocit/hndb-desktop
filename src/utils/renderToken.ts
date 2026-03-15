import { SqlToken } from '@/helpers'
import { DataSourceType } from '@/schemas'

const escapeIdentifier = (value: string, type: DataSourceType) => {
	switch (type) {
		case 'postgresql':
		case 'sqlite':
			return `"${value.replace(/"/g, '""')}"`
		case 'mysql':
		case 'maria-db':
			return `\`${value.replace(/`/g, '``')}\``
		case 'sql-server':
			return `[${value.replace(/]/g, ']]')}]`
	}
}

const escapeLiteral = (value: unknown, type: DataSourceType) => {
	if (value === null || value === undefined) return 'NULL'
	if (typeof value === 'number')
		return Number.isFinite(value) ? String(value) : 'NULL'
	if (typeof value === 'boolean') {
		if (type === 'sql-server') return value ? '1' : '0'
		return value ? 'TRUE' : 'FALSE'
	}
	if (typeof value === 'string') {
		return `'${value.replace(/'/g, "''")}'`
	}
	return `'${String(value).replace(/'/g, "''")}'`
}

export const renderToken = (token: SqlToken, type: DataSourceType) => {
	switch (token.kind) {
		case 'identifier':
			return escapeIdentifier(token.value, type)
		case 'literal':
			return escapeLiteral(token.value, type)
		case 'raw':
			return token.value
	}
}
