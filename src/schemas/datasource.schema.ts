import { z } from 'zod'

export const datasourceSchema = z.enum([
	'postgresql',
	'mysql',
	'sqlite',
	'sql-server',
	'maria-db',
])

export type DataSourceType = z.infer<typeof datasourceSchema>

export const ConnectionMethod = z.enum(['host', 'url'])

export const driverPropertySchema = z.object({
	key: z.string(),
	value: z.string(),
})

const baseDataSourceSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	type: datasourceSchema,
	savePassword: z.boolean(),
	showAllDatabases: z.boolean(),
	driverProperties: z.array(driverPropertySchema).default([]),
	username: z.string().optional(),
	password: z.string().optional(),
})

const hostConnectionSchema = baseDataSourceSchema
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
			data.type === 'postgresql' || data.type === 'sql-server'
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
					:	`${data.type} requires a database name`,
				path: ['database_name'],
			})
		}
	})

const urlConnectionSchema = baseDataSourceSchema.extend({
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

export const dataSourceSchema = z.discriminatedUnion('method', [
	hostConnectionSchema,
	urlConnectionSchema,
])

export type DriverProperty = z.infer<typeof driverPropertySchema>
export type DataSourceFormValues = z.input<typeof dataSourceSchema>
export type DataSourceFormData = z.infer<typeof dataSourceSchema>
export type HostConnectionData = z.infer<typeof hostConnectionSchema>
export type UrlConnectionData = z.infer<typeof urlConnectionSchema>
