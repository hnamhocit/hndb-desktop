import type { IDataSource } from '@/interfaces'
import type {
	DataSourceFormData,
	DataSourceFormValues,
	DataSourceType,
	DriverProperty,
} from '@/schemas'

export interface DbSetting {
	name: string
	value: string
	category: string | null
	description: string | null
	setting_type: 'bool' | 'integer' | 'real' | 'string' | 'enum'
	enum_values: string[] | null
	min_val: string | null
	max_val: string | null
	is_editable: boolean
}

export interface TestConnectionProbeResult {
	success: boolean
	error: string | null
	server_version: string
	advanced_settings: DbSetting[]
}

interface FieldsConnectionMode {
	type: 'fields'
	host: string
	port: number
	database: string
	username: string
	password: string | null
}

interface UrlConnectionMode {
	type: 'url'
	connection_string: string
}

export interface ConnectionConfigPayload {
	driver: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql'
	mode: FieldsConnectionMode | UrlConnectionMode
}

export const normalizeDriverProperties = (input: unknown): DriverProperty[] => {
	if (!input) {
		return []
	}

	if (Array.isArray(input)) {
		return input.map((item) => ({
			key:
				typeof item?.key === 'string' ? item.key : String(item?.key || ''),
			value:
				typeof item?.value === 'string' ?
					item.value
				:	(JSON.stringify(item?.value ?? '') ?? String(item?.value ?? '')),
		}))
	}

	if (typeof input === 'object') {
		return Object.entries(input).map(([key, value]) => ({
			key,
			value:
				typeof value === 'string' ?
					value
				:	(JSON.stringify(value ?? '') ?? String(value ?? '')),
		}))
	}

	return []
}

export const mapDataSourceToFormData = (
	dataSource: IDataSource,
): DataSourceFormValues => {
	const baseFormData = {
		name: dataSource.name,
		type: dataSource.type,
		savePassword: dataSource.config.savePassword ?? true,
		showAllDatabases: dataSource.config.showAllDatabases ?? true,
		driverProperties: normalizeDriverProperties(
			dataSource.config.driverProperties,
		),
		username: dataSource.config.username || '',
		password: dataSource.config.password || '',
	}

	if (dataSource.config.method === 'url') {
		return {
			...baseFormData,
			method: 'url',
			url: dataSource.config.url || '',
		}
	}

	return {
		...baseFormData,
		method: 'host',
		host: dataSource.config.host || '',
		port: dataSource.config.port,
		database_name: dataSource.config.database_name || '',
	}
}

export const getDialogTitle = ({
	step,
	isEditMode,
	selectedName,
}: {
	step: 1 | 2
	isEditMode: boolean
	selectedName?: string
}) => {
	if (step === 1) {
		return 'Select Data Source'
	}

	if (isEditMode) {
		return `Edit ${selectedName || 'Connection'}`
	}

	return `Configure ${selectedName || 'Database'}`
}

const DRIVER_ALIASES: Record<DataSourceType, ConnectionConfigPayload['driver']> = {
	postgresql: 'postgres',
	mysql: 'mysql',
	sqlite: 'sqlite',
	'sql-server': 'mssql',
	'maria-db': 'mariadb',
}

const normalizeConnectionString = (
	driver: ConnectionConfigPayload['driver'],
	connectionString: string,
) => {
	if (driver === 'postgres' && connectionString.startsWith('postgres://')) {
		return connectionString.replace(/^postgres:\/\//, 'postgresql://')
	}

	if (driver === 'mariadb' && connectionString.startsWith('mariadb://')) {
		return connectionString.replace(/^mariadb:\/\//, 'mysql://')
	}

	if (driver === 'mssql' && connectionString.startsWith('sqlserver://')) {
		return connectionString.replace(/^sqlserver:\/\//, 'mssql://')
	}

	return connectionString
}

export const buildConnectionConfig = (
	formData: DataSourceFormData,
): ConnectionConfigPayload => {
	const driver = DRIVER_ALIASES[formData.type]

	if (formData.method === 'url') {
		return {
			driver,
			mode: {
				type: 'url',
				connection_string: normalizeConnectionString(driver, formData.url),
			},
		}
	}

	return {
		driver,
		mode: {
			type: 'fields',
			host: formData.host || '',
			port: formData.port ?? 0,
			database: formData.database_name || '',
			username: formData.username || '',
			password: formData.password || null,
		},
	}
}

export const upsertDriverProperty = (
	properties: DriverProperty[],
	key: string,
	value: string,
) => {
	const index = properties.findIndex((property) => property.key === key)
	if (index === -1) {
		return [...properties, { key, value }]
	}

	return properties.map((property, propertyIndex) =>
		propertyIndex === index ? { ...property, value } : property,
	)
}

export const removeDriverProperty = (
	properties: DriverProperty[],
	key: string,
) => {
	return properties.filter((property) => property.key !== key)
}
