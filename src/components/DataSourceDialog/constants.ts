import type { DataSourceFormValues, DriverProperty } from '@/schemas'

export const DEFAULT_FORM_VALUES: DataSourceFormValues = {
	name: '',
	type: 'postgresql',
	method: 'host',
	host: 'localhost',
	port: 5432,
	database_name: '',
	savePassword: true,
	showAllDatabases: true,
	driverProperties: [] as DriverProperty[],
	username: 'postgres',
	password: '',
}
