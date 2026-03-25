export interface IConnection {
	id: string
	name: string
	config: {
		driver: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql'
		mode:
		| {
			type: 'fields'
			host: string
			port: number
			database: string
			username: string
			password: string | null
		}
		| {
			type: 'url'
			connection_string: string
		}
	}
	setting_overrides?: Record<string, string>
	save_password?: boolean
	show_all_databases?: boolean
	session_password?: string | null
	created_at: string
}

export type IDataSource = IConnection

export const getConnectionSavePassword = (
	connection?: Pick<IConnection, 'config' | 'save_password'> | null,
) => {
	if (!connection) {
		return true
	}

	if (typeof connection.save_password === 'boolean') {
		return connection.save_password
	}

	return (
		connection.config.mode.type !== 'fields' ||
		connection.config.mode.password !== null
	)
}

export const getConnectionShowAllDatabases = (
	connection?: Pick<IConnection, 'show_all_databases'> | null,
) => connection?.show_all_databases ?? true
