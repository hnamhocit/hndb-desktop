import { ConnectionType } from "@/schemas"

interface SupportConnection {
	id: ConnectionType
	name: string
	photoURL: string
}

export const supportConnections: SupportConnection[] = [
	{
		id: 'postgres',
		name: 'PostgreSQL',
		photoURL: '/data_sources/postgresql.svg',
	},
	{
		id: 'mysql',
		name: 'MySQL',
		photoURL: '/data_sources/mysql.png',
	},
	{
		id: 'sqlite',
		name: 'SQLite',
		photoURL: '/data_sources/sqlite.png',
	},
	{
		id: 'mssql',
		name: 'SQL Server',
		photoURL: '/data_sources/sql-server.jpg',
	},
	{
		id: 'mariadb',
		name: 'MariaDB',
		photoURL: '/data_sources/maria-db.svg',
	},
] as const
