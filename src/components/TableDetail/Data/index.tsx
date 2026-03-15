'use client'

import { CheckCircle2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DatabaseTable from '@/components/DatabaseTable'
import { useActiveTab, useActiveTablePath, useSchema } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { databaseService } from '@/services'
import { useDataEditorStore } from '@/stores'
import { notifyError } from '@/utils'
import Actions from './Actions'
import QueryResultFooter from './QueryResultFooter'

const Data = () => {
	const [resultMeta, setResultMeta] = useState<IQueryResult | null>(null)
	const [rows, setRows] = useState<Record<string, unknown>[]>([])
	const [isInitialLoading, setIsInitialLoading] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [page, setPage] = useState(1)
	const [limit] = useState(200)
	const [hasMore, setHasMore] = useState(true)

	const rowsRef = useRef<Record<string, unknown>[]>([])

	const activeTab = useActiveTab()
	const { initializeTable, discardTableChanges } = useDataEditorStore()

	const dataSourceId = activeTab?.dataSourceId ?? ''
	const database = activeTab?.database ?? ''
	const table = activeTab?.table ?? ''

	const canLoad = !!dataSourceId && !!database && !!table

	const { schema } = useSchema(dataSourceId, database)

	const columns = useMemo(() => {
		if (!table) return []
		return schema?.[table] || []
	}, [schema, table])

	const primaryColumnName =
		columns.find((col) => col.is_primary)?.column_name || 'id'

	const tablePath = useActiveTablePath()

	useEffect(() => {
		rowsRef.current = rows
	}, [rows])

	const fetchPage = useCallback(
		async (nextPage: number, mode: 'replace' | 'append') => {
			if (!dataSourceId || !database || !table || !tablePath) return

			if (mode === 'replace') {
				setIsInitialLoading(true)
			} else {
				setIsLoadingMore(true)
			}

			try {
				const { data } = await databaseService.getTablePreview(
					dataSourceId,
					database,
					table,
					nextPage,
					limit,
				)

				const nextRows = data.data.rows || []
				const mergedRows =
					mode === 'replace' ? nextRows : (
						[...rowsRef.current, ...nextRows]
					)

				setResultMeta(data.data)
				setHasMore(nextRows.length === limit)
				setRows(mergedRows)

				discardTableChanges(tablePath)
				initializeTable(tablePath, mergedRows)
			} catch (error) {
				notifyError(error, 'Failed to fetch table preview.')
			} finally {
				if (mode === 'replace') {
					setIsInitialLoading(false)
				} else {
					setIsLoadingMore(false)
				}
			}
		},
		[
			dataSourceId,
			database,
			table,
			tablePath,
			limit,
			discardTableChanges,
			initializeTable,
		],
	)

	useEffect(() => {
		if (!canLoad) return

		setPage(1)
		setRows([])
		rowsRef.current = []
		setResultMeta(null)
		setHasMore(true)

		void fetchPage(1, 'replace')
	}, [canLoad, dataSourceId, database, table, fetchPage])

	const refreshData = useCallback(async () => {
		setPage(1)
		setRows([])
		rowsRef.current = []
		setResultMeta(null)
		setHasMore(true)

		await fetchPage(1, 'replace')
	}, [fetchPage])

	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || isInitialLoading || !hasMore) return

		const nextPage = page + 1
		setPage(nextPage)
		await fetchPage(nextPage, 'append')
	}, [page, hasMore, isLoadingMore, isInitialLoading, fetchPage])

	if (!canLoad) return null

	return (
		<>
			<Actions
				refreshData={refreshData}
				primaryColumnName={primaryColumnName}
			/>

			{isInitialLoading ?
				<div className='w-full h-64 flex items-center justify-center gap-2 text-primary'>
					<CheckCircle2Icon
						size={18}
						className='animate-spin'
					/>
					<span>Loading data...</span>
				</div>
			:	<DatabaseTable
					columns={columns}
					initialData={rows}
					primaryColumnName={primaryColumnName}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
				/>
			}

			{resultMeta && !isInitialLoading && (
				<QueryResultFooter
					result={{
						...resultMeta,
						rows,
					}}
				/>
			)}
		</>
	)
}

export default Data
