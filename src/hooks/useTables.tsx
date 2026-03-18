import { useCallback, useEffect, useRef, useState } from 'react'

import { connectionService } from '@/services'
import { useConnectionStore, useMetadataStore } from '@/stores'
import { notifyError } from '@/utils'

export const useTables = (dataSourceId: string, database: string) => {
	const connectionStatus = useConnectionStore(
		(state) => state.statuses[dataSourceId],
	)
	const { tables: cachedTables, setTables } = useMetadataStore()
	const [isLoading, setIsLoading] = useState(false)
	const inFlightRef = useRef(false)

	const cacheKey = `${dataSourceId}-${database}`
	const cached = cachedTables[cacheKey]
	const tables = cached ?? []
	const hasCachedTables = cached !== undefined
	const isDisconnected = connectionStatus === false

	const fetchTables = useCallback(
		async (forceReload = false) => {
			if (!dataSourceId || !database) return
			if (isDisconnected) {
				setIsLoading(false)
				return
			}
			if (!forceReload && hasCachedTables) return
			if (inFlightRef.current) return

			inFlightRef.current = true
			setIsLoading(true)

			try {
				const { data } = await connectionService.getTables(
					dataSourceId,
					database,
				)

				setTables(cacheKey, data.data ?? [])
			} catch (error) {
				notifyError(error, 'Failed to fetch tables.')
			} finally {
				inFlightRef.current = false
				setIsLoading(false)
			}
		},
		[
			dataSourceId,
			database,
			cacheKey,
			hasCachedTables,
			isDisconnected,
			setTables,
		],
	)

	useEffect(() => {
		void fetchTables()
	}, [fetchTables, dataSourceId, database])

	const reload = useCallback(async () => {
		await fetchTables(true)
	}, [fetchTables])

	return { tables, isLoading, reload, hasCachedTables }
}
