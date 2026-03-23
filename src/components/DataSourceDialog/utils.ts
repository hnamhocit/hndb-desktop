import type { IConnection } from '@/interfaces'
import type { TranslationKey } from '@/i18n/messages'
import type {
	DataSourceFormData,
	DataSourceFormValues,
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
	dataSource: IConnection,
): DataSourceFormValues => {
	const mode = dataSource.config.mode
	const baseFormData = {
		name: dataSource.name,
		type: dataSource.config.driver,
		savePassword: true,
		showAllDatabases: true,
		driverProperties: normalizeDriverProperties(
			dataSource.setting_overrides,
		),
		username: mode.type === 'fields' ? mode.username || '' : '',
		password:
			mode.type === 'fields' ? (mode.password || '') : '',
	}

	if (mode.type === 'url') {
		return {
			...baseFormData,
			method: 'url',
			url: mode.connection_string || '',
		}
	}

	return {
		...baseFormData,
		method: 'host',
		host: mode.host || '',
		port: mode.port,
		database_name: mode.database || '',
	}
}

export const getDialogTitle = ({
	step,
	isEditMode,
	selectedName,
	t,
}: {
	step: 1 | 2
	isEditMode: boolean
	selectedName?: string
	t: (key: TranslationKey, params?: Record<string, string | number>) => string
}) => {
	if (step === 1) {
		return t('dataSource.dialog.selectTitle')
	}

	if (isEditMode) {
		return t('dataSource.dialog.editTitle', {
			name: selectedName || t('dataSource.dialog.defaultConnectionName'),
		})
	}

	return t('dataSource.dialog.configureTitle', {
		name: selectedName || t('dataSource.dialog.defaultDatabaseName'),
	})
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
	const driver = formData.type

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

export const buildConnectedDataSource = (
	id: string,
	formData: DataSourceFormData,
): IConnection => {
	const createdAt = new Date().toISOString()
	const driverProperties = Object.fromEntries(
		(formData.driverProperties || [])
			.filter(
				(property) =>
					property.key.trim() !== '' && property.value.trim() !== '',
			)
			.map((property) => [property.key, property.value]),
	)

	return {
		id,
		name: formData.name,
		config:
			formData.method === 'url' ?
				{
					driver: formData.type,
					mode: {
						type: 'url',
						connection_string: normalizeConnectionString(
							formData.type,
							formData.url,
						),
					},
				}
			:	{
					driver: formData.type,
					mode: {
						type: 'fields',
						host: formData.host || '',
						port: formData.port ?? 0,
						database: formData.database_name || '',
						username: formData.username || '',
						password:
							formData.savePassword ? (formData.password ?? '') : null,
					},
				},
		setting_overrides: driverProperties,
		created_at: createdAt,
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
