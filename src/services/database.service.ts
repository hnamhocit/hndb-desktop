import { api } from '@/config'

const basePath = 'data_sources'

export const databaseService = {
	getTablePreview: async (
		dataSourceId: string,
		database: string,
		table: string,
		page: number = 1,
		limit: number = 200,
	) => {
		return api.get(
			`/${basePath}/${dataSourceId}/databases/${database}/tables/${table}/preview`,
			{
				params: {
					page,
					limit,
				},
			},
		)
	},

	getTableRelationships: async (
		dataSourceId: string,
		database: string,
		table: string,
	) => {
		return api.get(
			`/${basePath}/${dataSourceId}/databases/${database}/tables/${table}/relationships`,
		)
	},

	getTableSchema: async (dataSourceId: string, database: string) => {
		return api.get(
			`/${basePath}/${dataSourceId}/databases/${database}/schema`,
		)
	},

	queryPlan: async (
		dataSourceId: string,
		query: string,
		database: string,
	) => {
		return api.post(
			`/${basePath}/${dataSourceId}/databases/${database}/query/plan`,
			{
				query,
				database,
			},
		)
	},
}
