import { SqlToken } from '@/helpers'
import { DataSourceType } from '@/schemas'

const escapeIdentifier = (value: string, type: DataSourceType) => {
	switch (type) {
		case 'postgres':
		case 'sqlite':
			return `"${value.replace(/"/g, '""')}"`
		case 'mysql':
		case 'mariadb':
			return `\`${value.replace(/`/g, '``')}\``
		case 'mssql':
			return `[${value.replace(/]/g, ']]')}]`
	}
}

export const renderToken = (token: SqlToken, type: DataSourceType) =>
	escapeIdentifier(token.value, type)
