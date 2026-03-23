import { z } from 'zod'

import type { TranslationKey } from '@/i18n/messages'
import { translate } from '@/i18n/messages'

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

type TranslateFn = (
	key: TranslationKey,
	params?: Record<string, string | number>,
) => string

const defaultTranslate: TranslateFn = (key, params) =>
	translate('en', key, params)

export const createConnectionSchema = (t: TranslateFn = defaultTranslate) => {
	const baseConnectionSchema = z.object({
		name: z.string().min(1, t('connection.schema.nameRequired')),
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
			if (data.type === 'sqlite') {
				if (!data.database_name || data.database_name.trim() === '') {
					ctx.addIssue({
						code: 'custom',
						message: t('connection.schema.sqlitePathRequired'),
						path: ['database_name'],
					})
				}
				return
			}

			if (!data.host) {
				ctx.addIssue({
					code: 'custom',
					message: t('connection.schema.hostRequired'),
					path: ['host'],
				})
			}
			if (!data.port) {
				ctx.addIssue({
					code: 'custom',
					message: t('connection.schema.portRequired'),
					path: ['port'],
				})
			}
			if (!data.username) {
				ctx.addIssue({
					code: 'custom',
					message: t('connection.schema.usernameRequired'),
					path: ['username'],
				})
			}

			const isDbNameRequiredByType =
				data.type === 'postgres' || data.type === 'mssql'
			const isDbNameRequiredByLogic = !data.showAllDatabases

			if (
				(isDbNameRequiredByType || isDbNameRequiredByLogic) &&
				(!data.database_name || data.database_name.trim() === '')
			) {
				ctx.addIssue({
					code: 'custom',
					message:
						!data.showAllDatabases ?
							t('connection.schema.databaseNameRequiredWhenHidden')
						:	t('connection.schema.databaseNameRequiredByType', {
								type: data.type,
							}),
					path: ['database_name'],
				})
			}
		})

	const urlConnectionSchema = baseConnectionSchema.extend({
		method: z.literal('url'),
		url: z
			.string()
			.min(1, t('connection.schema.urlRequired'))
			.refine((val) => {
				const patterns = [
					/^postgres(ql)?:\/\//,
					/^(mysql|mariadb):\/\//,
					/^sqlite:\/\//,
					/^(sqlserver|mssql):\/\//,
				]
				return patterns.some((p) => p.test(val))
			}, t('connection.schema.urlInvalid')),
	})

	return z.discriminatedUnion('method', [
		hostConnectionSchema,
		urlConnectionSchema,
	])
}

export const connectionSchema = createConnectionSchema()

export type DriverProperty = z.infer<typeof driverPropertySchema>
export type ConnectionFormValues = z.input<typeof connectionSchema>
export type ConnectionFormData = z.infer<typeof connectionSchema>
export type HostConnectionData = Extract<ConnectionFormData, { method: 'host' }>
export type UrlConnectionData = Extract<ConnectionFormData, { method: 'url' }>
export type DataSourceType = ConnectionType
export type DataSourceFormValues = ConnectionFormValues
export type DataSourceFormData = ConnectionFormData
