import { useCallback, useEffect, useRef, useState } from 'react'

import { connectionService } from '@/services'
import { useConnectionStore, useMetadataStore } from '@/stores'
import { formatErrorMessage, notifyError } from '@/utils'

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
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const inFlightRef = useRef(false)

	const connectionStatus = useConnectionStore(
		(state) => state.statuses[dataSourceId],
	)
	const { databases: cachedDatabases, setDatabases } = useMetadataStore()
	const cached =
		hasValidDataSourceId ? cachedDatabases[dataSourceId] : undefined
	const hasCachedDatabases = cached !== undefined
	const showAllDatabases = showAllOverride ?? false
	const isDisconnected = connectionStatus === false

	const databases = cached ?? []

	const fetchDatabases = useCallback(
		async (forceReload = false) => {
			if (!hasValidDataSourceId) return
			if (isDisconnected) {
				setErrorMessage('Connection is disconnected. Please connect again.')
				return
			}
			if (!forceReload && hasCachedDatabases) return
			if (inFlightRef.current) return

			inFlightRef.current = true
			setIsLoading(true)
			setErrorMessage(null)

			try {
				const { data } = await connectionService.getDatabases(
					dataSourceId,
					showAllDatabases,
				)

				setDatabases(dataSourceId, data.data ?? [])
			} catch (error) {
				setErrorMessage(
					formatErrorMessage(error, 'Failed to fetch databases.'),
				)
				notifyError(error, 'Failed to fetch databases.')
			} finally {
				inFlightRef.current = false
				setIsLoading(false)
			}
		},
		[
			dataSourceId,
			showAllDatabases,
			hasCachedDatabases,
			setDatabases,
			hasValidDataSourceId,
			isDisconnected,
		],
	)

	useEffect(() => {
		if (!autoFetch || !hasValidDataSourceId) return
		void fetchDatabases()
	}, [fetchDatabases, autoFetch, hasValidDataSourceId])

	useEffect(() => {
		if (isDisconnected) {
			setIsLoading(false)
			setErrorMessage('Connection is disconnected. Please connect again.')
		}
	}, [isDisconnected])

	const reload = useCallback(async () => {
		await fetchDatabases(true)
	}, [fetchDatabases])

	return { databases, isLoading, reload, hasCachedDatabases, errorMessage }
}
