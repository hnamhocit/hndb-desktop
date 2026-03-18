import { useCallback, useEffect, useRef, useState } from 'react'

import { connectionService } from '@/services'
import { useConnectionStore, useMetadataStore } from '@/stores'
import {
	buildDatabaseCacheKey,
	normalizeSchemaRecord,
	notifyError,
} from '@/utils'

export const useSchema = (connectionId: string, database: string) => {
	const connectionStatus = useConnectionStore(
		(state) => state.statuses[connectionId],
	)
	const { schema: cachedSchema, setSchema } = useMetadataStore()
	const [isLoading, setIsLoading] = useState(false)
	const inFlightRef = useRef(false)

	const cacheKey = buildDatabaseCacheKey(connectionId, database)
	const cached = cachedSchema[cacheKey]
	const schema = cached ?? {}
	const hasCachedSchema =
		cached !== undefined && Object.keys(cached).length > 0
	const isDisconnected = connectionStatus === false

	const fetchSchema = useCallback(
		async (forceReload = false) => {
			if (!connectionId || !database || !cacheKey) return
			if (isDisconnected) {
				setIsLoading(false)
				return
			}
			if (!forceReload && hasCachedSchema) return
			if (inFlightRef.current) return

			inFlightRef.current = true
			setIsLoading(true)

			try {
				const { data } = await connectionService.getTableSchema(
					connectionId,
					database,
				)

				setSchema(cacheKey, normalizeSchemaRecord(data.data))
			} catch (error) {
				notifyError(error, 'Failed to fetch schema.')
			} finally {
				inFlightRef.current = false
				setIsLoading(false)
			}
		},
		[
			connectionId,
			database,
			cacheKey,
			hasCachedSchema,
			isDisconnected,
			setSchema,
		],
	)

	useEffect(() => {
		void fetchSchema()
	}, [fetchSchema, connectionId, database])

	const reload = useCallback(async () => {
		await fetchSchema(true)
	}, [fetchSchema])

	return { schema, isLoading, reload, hasCachedSchema }
}
