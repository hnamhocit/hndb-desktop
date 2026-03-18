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
	created_at: string
}

export type IDataSource = IConnection
