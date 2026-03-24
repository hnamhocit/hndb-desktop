import { useCallback, useEffect, useRef, useState } from 'react'

import { connectionService } from '@/services'
import { useConnectionStore, useMetadataStore } from '@/stores'
import { formatErrorMessage, notifyError } from '@/utils'
import { useI18n } from './useI18n'

interface UseDatabasesOptions {
	autoFetch?: boolean
	showAllOverride?: boolean
}

export const useDatabases = (
	dataSourceId: string,
	options?: UseDatabasesOptions,
) => {
	const { t } = useI18n()
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
	const {
		databases: cachedDatabases,
		setDatabases,
		refreshTick,
	} = useMetadataStore()
	const cached =
		hasValidDataSourceId ? cachedDatabases[dataSourceId] : undefined
	const hasCachedDatabases = cached !== undefined
	const showAllDatabases = showAllOverride ?? false
	const isDisconnected = connectionStatus === false

	const databases = cached ?? []

	useEffect(() => {
		setIsLoading(false)
		setErrorMessage(null)
		inFlightRef.current = false
	}, [dataSourceId])

	const fetchDatabases = useCallback(
		async (forceReload = false) => {
			if (!hasValidDataSourceId) return
			if (isDisconnected) {
				setIsLoading(false)
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
					formatErrorMessage(
						error,
						t('errors.failedFetchDatabasesWithHint'),
					),
				)
				notifyError(error, t('errors.failedFetchDatabases'))
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
			t,
		],
	)

	useEffect(() => {
		if (!autoFetch || !hasValidDataSourceId) return
		void fetchDatabases()
	}, [fetchDatabases, autoFetch, hasValidDataSourceId])

	useEffect(() => {
		if (refreshTick > 0 && autoFetch && hasValidDataSourceId) {
			void fetchDatabases(true)
		}
	}, [refreshTick, autoFetch, hasValidDataSourceId, fetchDatabases])

	const reload = useCallback(async () => {
		await fetchDatabases(true)
	}, [fetchDatabases])

	return { databases, isLoading, reload, hasCachedDatabases, errorMessage }
}
