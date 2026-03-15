import { SqlToken } from '@/helpers'
import { DataSourceType } from '@/schemas'
import { useDataSourcesStore } from '@/stores'

type QueryParams = Record<string, SqlToken>

type DialectQueryResolver =
	| string
	| ((params: QueryParams, dialect: DataSourceType) => string | null)

type DialectQueryMap = Partial<Record<DataSourceType, DialectQueryResolver>> & {
	fallback?: DialectQueryResolver
}

export const resolveQueryByDialect = (
	dataSourceId: string,
	queries: DialectQueryMap,
	params: QueryParams = {},
) => {
	const { datasources } = useDataSourcesStore.getState()

	const dialect = datasources.find((ds) => ds.id === dataSourceId)?.type

	if (!dialect) return null

	const resolver = queries[dialect] ?? queries.fallback

	if (!resolver) return null

	return typeof resolver === 'function' ? resolver(params, dialect) : resolver
}
