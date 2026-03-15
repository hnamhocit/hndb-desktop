import { z } from 'zod'

import { datasourceSchema } from '@/schemas'
import { IDocument } from './document'

export interface IDataSourceConfig {
	method: 'host' | 'url'
	savePassword?: boolean
	showAllDatabases?: boolean
	driverProperties?:
		| Array<{ key: string; value: string }>
		| Record<string, unknown>

	// Dành cho method 'host'
	host?: string
	port?: number
	database_name?: string
	username?: string
	password?: string

	// Dành cho method 'url'
	url?: string
}

export interface IDataSource extends IDocument {
	user_id: string
	name: string
	type: z.infer<typeof datasourceSchema>
	config: IDataSourceConfig
}
