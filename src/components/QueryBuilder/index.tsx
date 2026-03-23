import clsx from 'clsx'
import {
	ArrowDownToLineIcon,
	DatabaseIcon,
	HistoryIcon,
	PlayIcon,
	SaveIcon,
	TimerIcon,
	WandSparklesIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useActiveTab, useI18n } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { connectionService } from '@/services'
import { useConnectionStore, useTabsStore } from '@/stores'
import {
	exportToCsv,
	formatCompactCount,
	formatDurationMs,
	getTabConnectionId,
	notifyError,
} from '@/utils'
import { Button } from '../ui/button'
import ConfirmQueryDialog from './ConfirmQueryDialog'
import SqlContextSelector from './SqlContextSelector'
import SqlEditor from './SqlEditor'
import TabContent from './TabContent'

const tabIds = ['results', 'execution-log', 'query-plan'] as const

export type TabId = (typeof tabIds)[number]

const DANGEROUS_QUERY_MARKER = 'DANGEROUS_QUERY'

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

const QueryBuilder = () => {
	const { t } = useI18n()
	const [currentTab, setCurrentTab] = useState<TabId>('results')
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<IQueryResult | null>(null)
	const [isOpen, setIsOpen] = useState(false)

	const { contentById } = useTabsStore()
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab)
	const connectionStatus = useConnectionStore((state) =>
		connectionId ? state.statuses[connectionId] : undefined,
	)
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

	const toggleIsOpen = () => setIsOpen((prev) => !prev)

	useEffect(() => {
		if (!isDisconnected) return

		setResult(null)
		setCurrentTab('results')
	}, [isDisconnected])

	const handleRunQuery = async (forced: boolean = false) => {
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

		setIsLoading(true)

		try {
			const query = contentById[activeTab.id]
			const { data } = await connectionService.executeQuery(
				connectionId,
				activeTab.database,
				query,
				forced,
			)

			setResult(data.data)

			if (data.data.rows.length === 0) {
				setCurrentTab('execution-log')
			}
		} catch (error) {
			if (!forced && isDangerousQueryError(error)) {
				setIsOpen(true)
				return
			}

				notifyError(error, t('errors.failedRunQuery'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex flex-col h-full min-h-0'>
			<div className='border-b p-2 sm:p-4 space-y-2'>
				<div className='overflow-x-auto'>
					<div className='flex w-max min-w-full items-center gap-2 sm:gap-4'>
						<Button
								data-hotkey-run-query
								onClick={() => handleRunQuery()}
								disabled={isLoading || isDisconnected}
								size='sm'>
							<PlayIcon />
							{t('query.execute')}
						</Button>

						<div className='w-px h-5 sm:h-6 bg-neutral-300 dark:bg-neutral-700' />

						<Button
							size='icon'
							variant='ghost'>
							<SaveIcon />
						</Button>

						<Button
							size='icon'
							variant='ghost'>
							<WandSparklesIcon />
						</Button>

						<Button
							size='icon'
							variant='ghost'>
							<HistoryIcon />
						</Button>
					</div>
				</div>

				<div className='overflow-x-auto'>
					<SqlContextSelector />
				</div>
			</div>

			<SqlEditor />

			{result && (
				<>
					{/* Thanh Tabs & Stats (Đã thêm border-b để tách biệt với nội dung bên dưới) */}
					<div className='pt-2 px-2 sm:px-4 shrink-0 border-b dark:border-slate-800 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between'>
						<div className='flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0'>
							{tabs.map((tab) => (
								<div
									key={tab.id}
									className={clsx(
										'py-2 px-3 sm:px-4 cursor-pointer transition-colors whitespace-nowrap shrink-0',
										{
											'border-b-2 border-primary text-primary font-bold':
												currentTab === tab.id,
											'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold':
												currentTab !== tab.id,
										},
									)}
									onClick={() => setCurrentTab(tab.id)}>
									{tab.title}
								</div>
							))}
						</div>

							{/* Stats chỉ hiện ở tab Results */}
							{currentTab === 'results' && (
								<div className='flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 text-neutral-700 dark:text-neutral-400 font-mono font-medium text-xs sm:text-sm whitespace-nowrap'>
									<div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
										<TimerIcon size={16} />
										<div>{formatDurationMs(result.durationMs)}</div>
									</div>

									<div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
										<DatabaseIcon size={16} />
										<div>
											{formatCompactCount(
												result.rows.length ||
													result.affectedRows ||
													0,
											)} {t('table.result.rows')}
										</div>
									</div>

								{result.isLimited && (
									<div className='shrink-0 rounded border border-amber-300/80 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-300 sm:text-xs'>
										{t('query.limitedResultSet')}
									</div>
								)}

								{result?.rows.length > 0 && (
									<>
										<div className='w-px h-4 bg-neutral-300 dark:bg-neutral-700 shrink-0'></div>

										<div
											className='flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-primary transition-colors shrink-0'
											onClick={() => {
												const timestamp = new Date()
													.toISOString()
													.replace(/[:.]/g, '-')
												exportToCsv(
													`query-result-${timestamp}`,
													result.rows as Record<
														string,
														unknown
													>[],
												)
											}}>
											<ArrowDownToLineIcon size={16} />
											<div>{t('query.exportCsv')}</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>

					<TabContent
						currentTab={currentTab}
						result={result}
					/>
				</>
			)}

			<ConfirmQueryDialog
				isOpen={isOpen}
				onOpenChange={toggleIsOpen}
				onRunQuery={handleRunQuery}
			/>
		</div>
	)
}

export default QueryBuilder
