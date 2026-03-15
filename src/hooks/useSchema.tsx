import { useCallback, useEffect, useRef, useState } from 'react'

import { databaseService } from '@/services'
import { useDataSourcesStore } from '@/stores'
import { notifyError } from '@/utils'

export const useSchema = (dataSourceId: string, database: string) => {
	const { cachedSchema, setCachedSchema } = useDataSourcesStore()
	const [isLoading, setIsLoading] = useState(false)
	const inFlightRef = useRef(false)

	const cacheKey = `${dataSourceId}-${database}`
	const schema = cachedSchema[cacheKey] ?? {}
	const hasCachedSchema = !!cachedSchema[cacheKey]

	const fetchSchema = useCallback(
		async (forceReload = false) => {
			if (!dataSourceId || !database) return
			if (!forceReload && hasCachedSchema) return
			if (inFlightRef.current) return

			inFlightRef.current = true
			setIsLoading(true)

			try {
				const { data } = await databaseService.getTableSchema(
					dataSourceId,
					database,
				)

				setCachedSchema(cacheKey, data.data ?? {})
			} catch (error) {
				notifyError(error, 'Failed to fetch schema.')
			} finally {
				inFlightRef.current = false
				setIsLoading(false)
			}
		},
		[dataSourceId, database, cacheKey, hasCachedSchema, setCachedSchema],
	)

	useEffect(() => {
		void fetchSchema()
	}, [fetchSchema, dataSourceId, database])

	const reload = useCallback(async () => {
		await fetchSchema(true)
	}, [fetchSchema])

	return { schema, isLoading, reload, hasCachedSchema }
}
