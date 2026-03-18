import { z } from 'zod'

export const connectionTypeSchema = z.enum([
	'postgres',
	'mysql',
	'sqlite',
	'mssql',
	'mariadb',
])

export type ConnectionType = z.infer<typeof connectionTypeSchema>

export const ConnectionMethod = z.enum(['host', 'url'])

export const driverPropertySchema = z.object({
	key: z.string(),
	value: z.string(),
})

const baseConnectionSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	type: connectionTypeSchema,
	savePassword: z.boolean(),
	showAllDatabases: z.boolean(),
	driverProperties: z.array(driverPropertySchema).default([]),
	username: z.string().optional(),
	password: z.string().optional(),
})

const hostConnectionSchema = baseConnectionSchema
	.extend({
		method: z.literal('host'),
		host: z.string().optional(),
		port: z.number().int().min(1).max(65535).optional(),
		database_name: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		// Luồng 1: SQLite
		if (data.type === 'sqlite') {
			if (!data.database_name || data.database_name.trim() === '') {
				ctx.addIssue({
					code: 'custom',
					message: 'SQLite requires a file path (Database)',
					path: ['database_name'],
				})
			}
			return
		}

		// Luồng 2: Validate Server
		if (!data.host) {
			ctx.addIssue({
				code: 'custom',
				message: 'Host is required',
				path: ['host'],
			})
		}
		if (!data.port) {
			ctx.addIssue({
				code: 'custom',
				message: 'Port is required',
				path: ['port'],
			})
		}
		if (!data.username) {
			ctx.addIssue({
				code: 'custom',
				message: 'Username is required',
				path: ['username'],
			})
		}

		// Luồng 3: Logic chốt hạ cho Database Name
		const isDbNameRequiredByType =
			data.type === 'postgres' || data.type === 'mssql'
		const isDbNameRequiredByLogic = !data.showAllDatabases

		// Thêm hàm trim() để chống user gõ dấu cách
		if (
			(isDbNameRequiredByType || isDbNameRequiredByLogic) &&
			(!data.database_name || data.database_name.trim() === '')
		) {
			ctx.addIssue({
				code: 'custom',
				message:
					!data.showAllDatabases ?
						'Please specify a database name if you hide other databases'
						: `${data.type} requires a database name`,
				path: ['database_name'],
			})
		}
	})

const urlConnectionSchema = baseConnectionSchema.extend({
	method: z.literal('url'),
	url: z
		.string()
		.min(1, 'URL is required')
		.refine((val) => {
			const patterns = [
				/^postgres(ql)?:\/\//,
				/^(mysql|mariadb):\/\//, // Đã bổ sung mariadb
				/^sqlite:\/\//,
				/^(sqlserver|mssql):\/\//,
			]
			return patterns.some((p) => p.test(val))
		}, 'Invalid database URL format'),
})

export const connectionSchema = z.discriminatedUnion('method', [
	hostConnectionSchema,
	urlConnectionSchema,
])

export type DriverProperty = z.infer<typeof driverPropertySchema>
export type ConnectionFormValues = z.input<typeof connectionSchema>
export type ConnectionFormData = z.infer<typeof connectionSchema>
export type HostConnectionData = z.infer<typeof hostConnectionSchema>
export type UrlConnectionData = z.infer<typeof urlConnectionSchema>
export type DataSourceType = ConnectionType
export type DataSourceFormValues = ConnectionFormValues
export type DataSourceFormData = ConnectionFormData
