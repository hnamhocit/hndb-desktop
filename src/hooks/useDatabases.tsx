import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { dataSourcesService } from '@/services'
import { useDataSourcesStore } from '@/stores'
import { notifyError } from '@/utils'

interface UseDatabasesOptions {
	autoFetch?: boolean
	showAllOverride?: boolean
}

export const useDatabases = (
	dataSourceId: string,
	options?: UseDatabasesOptions,
) => {
	const autoFetch = options?.autoFetch ?? true
	const showAllOverride = options?.showAllOverride
	const hasValidDataSourceId =
		typeof dataSourceId === 'string' && dataSourceId.trim() !== ''

	const [isLoading, setIsLoading] = useState(false)
	const inFlightRef = useRef(false)
	const lastFetchedModeRef = useRef<string | null>(null)

	const { cachedDatabases, datasources, setCachedDatabases } =
		useDataSourcesStore()

	const cached = hasValidDataSourceId ?
			cachedDatabases[dataSourceId]
		:	undefined

	const showAllDatabases = useMemo(() => {
		if (!hasValidDataSourceId) return false

		if (typeof showAllOverride === 'boolean') {
			return showAllOverride
		}

		return (
			datasources.find((ds) => ds.id === dataSourceId)?.config
				?.showAllDatabases || false
		)
	}, [datasources, dataSourceId, hasValidDataSourceId, showAllOverride])

	const databases = cached ?? []
	const fetchModeKey = `${dataSourceId}:${showAllDatabases ? 'all' : 'filtered'}`

	const fetchDatabases = useCallback(
		async (forceReload = false) => {
			if (!hasValidDataSourceId) return
			const canUseCache =
				cached !== undefined &&
				lastFetchedModeRef.current === fetchModeKey
			if (!forceReload && canUseCache) return
			if (inFlightRef.current) return

			inFlightRef.current = true
			setIsLoading(true)

			try {
				const { data } = await dataSourcesService.getDatabases(
					dataSourceId,
					showAllDatabases,
				)

				setCachedDatabases(dataSourceId, data.data ?? [])
				lastFetchedModeRef.current = fetchModeKey
			} catch (error) {
				notifyError(error, 'Failed to fetch databases.')
			} finally {
				inFlightRef.current = false
				setIsLoading(false)
			}
		},
		[
			dataSourceId,
			showAllDatabases,
			cached,
			fetchModeKey,
			setCachedDatabases,
			hasValidDataSourceId,
		],
	)

	useEffect(() => {
		if (!autoFetch || !hasValidDataSourceId) return
		void fetchDatabases()
	}, [fetchDatabases, autoFetch, hasValidDataSourceId])

	const reload = useCallback(async () => {
		await fetchDatabases(true)
	}, [fetchDatabases])

	return { databases, isLoading, reload }
}
