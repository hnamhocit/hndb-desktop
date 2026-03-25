import clsx from 'clsx'
import {
	ArrowDownToLineIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DatabaseIcon,
	GripHorizontalIcon,
	TimerIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { format as formatSql } from 'sql-formatter'

import { useActiveTab, useI18n } from '@/hooks'
import { IConnection, IQueryResult } from '@/interfaces'
import { connectionService } from '@/services'
import {
	useConnectionStore,
	useMetadataStore,
	usePreferencesStore,
	useTabsStore,
} from '@/stores'
import {
	exportToCsv,
	formatCompactCount,
	formatDurationMs,
	formatErrorMessage,
	getTabConnectionId,
	notifyError,
} from '@/utils'
import { Button } from '../ui/button'
import ConfirmQueryDialog from './ConfirmQueryDialog'
import Header from './Header/index'
import SqlEditor, { type SqlEditorApi } from './SqlEditor'
import TabContent from './TabContent'

const tabIds = ['results', 'execution-log', 'query-plan'] as const

export type TabId = (typeof tabIds)[number]

const DANGEROUS_QUERY_MARKER = 'DANGEROUS_QUERY'
const RESULT_PANEL_MIN_HEIGHT = 220
const RESULT_PANEL_DEFAULT_HEIGHT = 320
const RESULT_PANEL_MAX_VIEWPORT_RATIO = 0.72
const QUERY_HISTORY_STORAGE_KEY = 'hndb.query.history'
const MAX_QUERY_HISTORY_ITEMS = 20
const HISTORY_DROPDOWN_LIMIT = 10
type QueryExecutionScope = 'smart' | 'all'

type QueryHistoryItem = {
	query: string
	savedAt: string
}

const getSqlFormatterLanguage = (driver: IConnection['config']['driver']) => {
	switch (driver) {
		case 'postgres':
			return 'postgresql'
		case 'mysql':
		case 'mariadb':
			return 'mysql'
		case 'sqlite':
			return 'sqlite'
		case 'mssql':
			return 'transactsql'
		default:
			return 'sql'
	}
}

const sanitizeFileName = (value: string) =>
	value
		.trim()
		.replace(/[^a-zA-Z0-9-_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')

const getErrorText = (error: unknown): string => {
	if (typeof error === 'string') {
		return error
	}

	if (error instanceof Error) {
		return error.message
	}

	if (typeof error === 'object' && error !== null) {
		const value = error as Record<string, unknown>

		for (const key of ['error', 'message', 'details', 'cause']) {
			const candidate = value[key]
			if (typeof candidate === 'string' && candidate.trim()) {
				return candidate
			}
		}
	}

	return ''
}

const isDangerousQueryError = (error: unknown) =>
	getErrorText(error).toUpperCase().includes(DANGEROUS_QUERY_MARKER)

const clampResultPanelHeight = (nextHeight: number) => {
	if (typeof window === 'undefined') {
		return Math.max(RESULT_PANEL_MIN_HEIGHT, nextHeight)
	}

	const maxHeight = Math.max(
		RESULT_PANEL_MIN_HEIGHT,
		Math.floor(window.innerHeight * RESULT_PANEL_MAX_VIEWPORT_RATIO),
	)

	return Math.min(maxHeight, Math.max(RESULT_PANEL_MIN_HEIGHT, nextHeight))
}

const QueryBuilder = () => {
	const { t } = useI18n()
	const [currentTab, setCurrentTab] = useState<TabId>('results')
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<IQueryResult | null>(null)
	const [executedQuery, setExecutedQuery] = useState('')
	const [executionError, setExecutionError] = useState<string | null>(null)
	const [isOpen, setIsOpen] = useState(false)
	const [resultPanelHeight, setResultPanelHeight] = useState(
		RESULT_PANEL_DEFAULT_HEIGHT,
	)
	const [isResultPanelCollapsed, setIsResultPanelCollapsed] = useState(false)
	const [isResizingResultPanel, setIsResizingResultPanel] = useState(false)
	const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>(() => {
		if (typeof window === 'undefined') {
			return []
		}

		try {
			const rawHistory = window.localStorage.getItem(
				QUERY_HISTORY_STORAGE_KEY,
			)
			if (!rawHistory) return []

			const parsedHistory = JSON.parse(rawHistory)
			if (!Array.isArray(parsedHistory)) return []

			return parsedHistory.filter(
				(item): item is QueryHistoryItem =>
					typeof item === 'object' &&
					item !== null &&
					typeof item.query === 'string' &&
					typeof item.savedAt === 'string',
			)
		} catch {
			return []
		}
	})
	const resultPanelResizeRef = useRef<{
		startY: number
		startHeight: number
	} | null>(null)
	const sqlEditorApiRef = useRef<SqlEditorApi | null>(null)
	const pendingForcedQueryRef = useRef<string | null>(null)

	const { contentById, commitContent } = useTabsStore()
	const { triggerRefresh } = useMetadataStore()
	const editorTheme = usePreferencesStore((state) => state.editorTheme)
	const setEditorTheme = usePreferencesStore((state) => state.setEditorTheme)
	const openSettingsShortcut = usePreferencesStore(
		(state) => state.keybindings.openSettingsJson,
	)
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab)
	const connections = useConnectionStore((state) => state.connections)
	const connectionStatus = useConnectionStore((state) =>
		connectionId ? state.statuses[connectionId] : undefined,
	)
	const connectionDriver =
		connections.find((connection) => connection.id === connectionId)?.config
			.driver ?? 'mysql'
	const currentQuery = activeTab ? (contentById[activeTab.id] ?? '') : ''
	const isDisconnected = connectionStatus === false
	const tabs = [
		{
			id: 'results' as const,
			title: t('query.tab.results'),
		},
		{
			id: 'execution-log' as const,
			title: t('query.tab.executionLog'),
		},
		{
			id: 'query-plan' as const,
			title: t('query.tab.queryPlan'),
		},
	]
	useEffect(() => {
		if (!isDisconnected) return

		setResult(null)
		setExecutedQuery('')
		setExecutionError(null)
		setCurrentTab('results')
		setIsResultPanelCollapsed(false)
	}, [isDisconnected])

	useEffect(() => {
		setIsResultPanelCollapsed(false)
	}, [result])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleWindowResize = () => {
			setResultPanelHeight((currentHeight) =>
				clampResultPanelHeight(currentHeight),
			)
		}

		window.addEventListener('resize', handleWindowResize)
		return () => window.removeEventListener('resize', handleWindowResize)
	}, [])

	useEffect(() => {
		if (!isResizingResultPanel) return

		const handlePointerMove = (event: PointerEvent) => {
			const resizeState = resultPanelResizeRef.current
			if (!resizeState) return

			const nextHeight =
				resizeState.startHeight + (resizeState.startY - event.clientY)
			setResultPanelHeight(clampResultPanelHeight(nextHeight))
		}

		const handlePointerUp = () => {
			resultPanelResizeRef.current = null
			setIsResizingResultPanel(false)
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
		}

		document.body.style.userSelect = 'none'
		document.body.style.cursor = 'ns-resize'
		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)

		return () => {
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
		}
	}, [isResizingResultPanel])

	useEffect(() => {
		if (typeof window === 'undefined') return

		window.localStorage.setItem(
			QUERY_HISTORY_STORAGE_KEY,
			JSON.stringify(queryHistory),
		)
	}, [queryHistory])

	const addQueryToHistory = (query: string) => {
		const trimmedQuery = query.trim()
		if (!trimmedQuery) return

		setQueryHistory((previousHistory) => {
			const dedupedHistory = previousHistory.filter(
				(item) => item.query !== trimmedQuery,
			)

			return [
				{
					query: trimmedQuery,
					savedAt: new Date().toISOString(),
				},
				...dedupedHistory,
			].slice(0, MAX_QUERY_HISTORY_ITEMS)
		})
	}

	const resolveQueryToRun = (
		scope: QueryExecutionScope,
		explicitQuery?: string | null,
	) => {
		if (explicitQuery && explicitQuery.trim()) {
			return explicitQuery.trim()
		}

		if (scope === 'all') {
			return currentQuery.trim()
		}

		return (
			sqlEditorApiRef.current?.getExecutableQuery('smart') ??
			currentQuery.trim()
		)
	}

	const handleRunQuery = async (
		forced: boolean = false,
		scope: QueryExecutionScope = 'smart',
		explicitQuery?: string | null,
	) => {
		if (!activeTab) {
			return
		}

		if (!connectionId) {
			toast.error(t('query.noDataSourceSelected'), {
				position: 'top-center',
			})
			return
		}

		if (isDisconnected) {
			toast.error(t('query.connectionDisconnected'), {
				position: 'top-center',
			})
			return
		}

		const query = resolveQueryToRun(scope, explicitQuery)
		if (!query) {
			toast.info(t('query.header.noQuery'))
			return
		}

		addQueryToHistory(query)

		setIsLoading(true)

		try {
			const { data } = await connectionService.executeQuery(
				connectionId,
				activeTab.database,
				query,
				forced,
			)

			// Simple DDL detection to trigger refresh for schema/databases/tables
			if (/^\s*(CREATE|ALTER|DROP|RENAME|TRUNCATE)\b/i.test(query)) {
				triggerRefresh()
			}

			setResult(data.data)
			setExecutedQuery(query)
			setExecutionError(null)
			setIsResultPanelCollapsed(false)

			if (data.data.rows.length === 0) {
				setCurrentTab('execution-log')
			} else {
				setCurrentTab('results')
			}
		} catch (error) {
			if (!forced && isDangerousQueryError(error)) {
				pendingForcedQueryRef.current = query
				setIsOpen(true)
				return
			}

			const errorMessage = formatErrorMessage(
				error,
				t('errors.failedRunQuery'),
			)
			notifyError(error, t('errors.failedRunQuery'))
			setResult(null)
			setExecutedQuery(query)
			setExecutionError(errorMessage)
			setCurrentTab('execution-log')
			setIsResultPanelCollapsed(false)
		} finally {
			setIsLoading(false)
		}
	}

	const handleConfirmDialogOpenChange = (open: boolean) => {
		setIsOpen(open)
		if (!open) {
			pendingForcedQueryRef.current = null
		}
	}

	const handleSaveQuery = () => {
		if (!activeTab || !currentQuery.trim()) {
			toast.info(t('query.header.noQuery'))
			return
		}

		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			const safeTitle =
				sanitizeFileName(activeTab.title) ||
				sanitizeFileName(t('query.tab.results')) ||
				'query'
			const fileName = `${safeTitle}-${timestamp}.sql`
			const file = new Blob([currentQuery], {
				type: 'text/sql;charset=utf-8',
			})
			const url = URL.createObjectURL(file)

			const link = document.createElement('a')
			link.href = url
			link.download = fileName
			link.click()

			URL.revokeObjectURL(url)

			toast.success(t('query.header.saveSuccess', { fileName }))
		} catch (error) {
			notifyError(error, t('query.header.saveFailed'))
		}
	}

	const handleFormatQuery = () => {
		if (!activeTab || !currentQuery.trim()) {
			toast.info(t('query.header.noQuery'))
			return
		}

		try {
			const formattedQuery = formatSql(currentQuery, {
				language: getSqlFormatterLanguage(connectionDriver),
				keywordCase: 'upper',
			})

			commitContent(activeTab.id, formattedQuery)
			toast.success(t('query.header.formatSuccess'))
		} catch (error) {
			notifyError(error, t('query.header.formatFailed'))
		}
	}

	const handleSelectHistoryQuery = (query: string) => {
		if (!activeTab) return

		commitContent(activeTab.id, query)
		toast.success(t('query.header.historyLoaded'))
	}

	const handleStartResizeResultPanel = (
		event: React.PointerEvent<HTMLButtonElement>,
	) => {
		event.preventDefault()
		resultPanelResizeRef.current = {
			startY: event.clientY,
			startHeight: resultPanelHeight,
		}
		setIsResizingResultPanel(true)
	}

	return (
		<div className='flex flex-col h-full min-h-0'>
			<Header
				onRunQuery={() => void handleRunQuery(false, 'smart')}
				onSaveQuery={handleSaveQuery}
				onFormatQuery={handleFormatQuery}
				onSelectHistoryQuery={handleSelectHistoryQuery}
				isLoading={isLoading}
				isDisconnected={isDisconnected}
				hasQuery={Boolean(currentQuery.trim())}
				recentQueries={queryHistory.slice(0, HISTORY_DROPDOWN_LIMIT)}
				editorTheme={editorTheme}
				onChangeEditorTheme={(theme) => {
					void setEditorTheme(theme)
				}}
				openSettingsShortcut={openSettingsShortcut}
			/>

			<div className='relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background'>
				<SqlEditor
					onRunQuery={() => void handleRunQuery(false, 'smart')}
					onRunAllQuery={() => void handleRunQuery(false, 'all')}
					onEditorReady={(api) => {
						sqlEditorApiRef.current = api
					}}
				/>

				{(result || executionError) && (
					<>
						{isResultPanelCollapsed ?
							<div className='pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 sm:px-4'>
								<div className='pointer-events-auto inline-flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur sm:text-sm'>
									{result ?
										<>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<TimerIcon size={14} />
												<span className='font-mono'>
													{formatDurationMs(
														result.durationMs,
													)}
												</span>
											</div>

											<div className='flex items-center gap-2 text-muted-foreground'>
												<DatabaseIcon size={14} />
												<span className='font-mono'>
													{formatCompactCount(
														result.rows.length ||
															result.affectedRows ||
															0,
													)}{' '}
													{t('table.result.rows')}
												</span>
											</div>
										</>
									:	<div className='text-red-400 font-medium truncate max-w-[18rem]'>
											{executionError}
										</div>
									}

									<Button
										size='sm'
										variant='outline'
										onClick={() =>
											setIsResultPanelCollapsed(false)
										}>
										<ChevronUpIcon />
										{t('query.resultPanel.show')}
									</Button>
								</div>
							</div>
						:	<div
								className={clsx(
									'absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden border border-border/80 border-b-0 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85 rounded-t-2xl',
									isResizingResultPanel && 'select-none',
								)}
								style={{
									height: `${resultPanelHeight}px`,
								}}>
								<div className='relative shrink-0 border-b border-border/70 px-3 pb-3 pt-2 sm:px-4'>
									<div className='absolute left-1/2 top-1 -translate-x-1/2'>
										<button
											type='button'
											onPointerDown={
												handleStartResizeResultPanel
											}
											aria-label={t(
												'query.resultPanel.resize',
											)}
											title={t(
												'query.resultPanel.resize',
											)}
											className='flex h-5 w-16 cursor-ns-resize items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground'>
											<GripHorizontalIcon size={16} />
										</button>
									</div>

									<div className='mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
										<div className='flex items-center gap-2 overflow-x-auto pb-1'>
											{tabs.map((tab) => (
												<button
													type='button'
													key={tab.id}
													className={clsx(
														'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm',
														currentTab === tab.id ?
															'bg-primary text-primary-foreground shadow-sm'
														:	'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
													)}
													onClick={() =>
														setCurrentTab(tab.id)
													}>
													{tab.title}
												</button>
											))}
										</div>

										<div className='flex flex-wrap items-center justify-between gap-2 lg:justify-end'>
											<div className='flex flex-wrap items-center gap-2 text-muted-foreground font-mono text-[11px] sm:text-xs'>
												{result && (
													<>
														<div className='flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1'>
															<TimerIcon
																size={14}
															/>
															<span>
																{formatDurationMs(
																	result.durationMs,
																)}
															</span>
														</div>

														<div className='flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1'>
															<DatabaseIcon
																size={14}
															/>
															<span>
																{formatCompactCount(
																	result.rows
																		.length ||
																		result.affectedRows ||
																		0,
																)}{' '}
																{t(
																	'table.result.rows',
																)}
															</span>
														</div>
													</>
												)}

												{result?.isLimited && (
													<div className='rounded-full border border-amber-300/80 bg-amber-100 px-2.5 py-1 text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-300'>
														{t(
															'query.limitedResultSet',
														)}
													</div>
												)}
											</div>

											<div className='flex items-center gap-2'>
												{result &&
													result.rows.length > 0 && (
														<Button
															size='sm'
															variant='outline'
															onClick={() => {
																const timestamp =
																	new Date()
																		.toISOString()
																		.replace(
																			/[:.]/g,
																			'-',
																		)
																const fileName = `query-result-${timestamp}`
																exportToCsv(
																	fileName,
																	result.rows as Record<
																		string,
																		unknown
																	>[],
																)
																toast.success(
																	t(
																		'query.csv.exportSuccess',
																		{
																			fileName: `${fileName}.csv`,
																		},
																	),
																)
															}}>
															<ArrowDownToLineIcon />
															{t(
																'query.exportCsv',
															)}
														</Button>
													)}

												<Button
													size='sm'
													variant='ghost'
													onClick={() =>
														setIsResultPanelCollapsed(
															true,
														)
													}>
													<ChevronDownIcon />
													{t(
														'query.resultPanel.hide',
													)}
												</Button>
											</div>
										</div>
									</div>
								</div>

								<div className='min-h-0 flex-1'>
									<TabContent
										currentTab={currentTab}
										result={result}
										executedQuery={executedQuery}
										connectionDriver={connectionDriver}
										executionError={executionError}
									/>
								</div>
							</div>
						}
					</>
				)}
			</div>

			<ConfirmQueryDialog
				isOpen={isOpen}
				onOpenChange={handleConfirmDialogOpenChange}
				onRunQuery={(force) =>
					void handleRunQuery(
						force,
						'smart',
						pendingForcedQueryRef.current,
					)
				}
			/>
		</div>
	)
}

export default QueryBuilder
