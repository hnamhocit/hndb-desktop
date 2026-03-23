import { Key, List, MoreVertical } from 'lucide-react'
import { useMemo } from 'react'

import { useActiveTab, useI18n, useSchema } from '@/hooks'
import { getTabConnectionId, resolveSchemaColumns } from '@/utils'

const TableStructure = () => {
	const { t } = useI18n()
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab) ?? ''
	const { schema, isLoading } = useSchema(
		connectionId,
		activeTab?.database || '',
	)

	const columns = useMemo(
		() => resolveSchemaColumns(schema, activeTab?.table || ''),
		[schema, activeTab?.table],
	)

	if (isLoading && columns.length === 0) {
		return (
			<div className='w-full min-h-screen flex items-center justify-center text-sm text-muted-foreground'>
				{t('table.structure.loading')}
			</div>
		)
	}

	if (!isLoading && columns.length === 0) {
		return (
			<div className='w-full min-h-screen flex items-center justify-center text-sm text-muted-foreground'>
				{t('table.structure.noMetadata')}
			</div>
		)
	}

	return (
		<div className='w-full p-3 sm:p-6 min-h-screen overflow-auto transition-colors duration-300'>
			<div className='w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1d27] shadow-sm dark:shadow-2xl transition-colors duration-300 overflow-x-auto'>
				<table className='min-w-[920px] w-full text-left border-collapse whitespace-nowrap'>
					{/* Header */}
					<thead className='text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent'>
						<tr>
							<th className='px-6 py-4 w-16'>#</th>
							<th className='px-6 py-4 w-32'>
								{t('table.structure.constraints')}
							</th>
							<th className='px-6 py-4'>
								{t('table.structure.columnName')}
							</th>
							<th className='px-6 py-4'>
								{t('table.structure.dataType')}
							</th>
							<th className='px-6 py-4'>
								{t('table.structure.nullable')}
							</th>
							<th className='px-6 py-4'>
								{t('table.structure.default')}
							</th>
							<th className='px-6 py-4 text-right'>
								{t('table.structure.actions')}
							</th>
						</tr>
					</thead>

					{/* Body */}
					<tbody className='text-sm'>
						{columns.map((col, index) => (
							<tr
								key={col.column_name}
								className='border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#202431] transition-colors duration-200'>
								<td className='px-6 py-4 text-slate-400 dark:text-slate-500 font-mono'>
									{index + 1}
								</td>

								<td className='px-6 py-4'>
									<div className='flex items-center gap-2'>
										{col.is_primary && (
											<Key
												size={16}
												className='text-yellow-500 -rotate-45'
												fill='currentColor'
											/>
										)}
										{col.is_foreign_key && (
											<Key
												size={16}
												className='text-slate-400 -rotate-45'
												fill='currentColor'
											/>
										)}
										{col.is_unique && (
											<div className='w-4.5 h-4.5 flex items-center justify-center rounded border border-orange-500/50 dark:border-orange-600/60 text-orange-600 dark:text-orange-500 text-[10px] font-bold bg-orange-100 dark:bg-orange-500/10'>
												U
											</div>
										)}
										{col.is_indexed && (
											<List
												size={16}
												className='text-blue-500'
											/>
										)}
									</div>
								</td>

								{/* Text tên cột: Đen (Light) -> Trắng (Dark) */}
								<td className='px-6 py-4 font-semibold text-slate-800 dark:text-slate-200'>
									{col.column_name}
								</td>

								{/* Kiểu dữ liệu */}
								<td className='px-6 py-4'>
									<span className='bg-slate-100 dark:bg-[#242938] text-slate-600 dark:text-slate-300 font-mono text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700/50'>
										{col.data_type}
									</span>
								</td>

								{/* Nullable Badges */}
								<td className='px-6 py-4'>
									{col.is_nullable ?
										<span className='border border-slate-200 dark:border-slate-600/60 bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide'>
											{t('table.structure.nullable')}
										</span>
									:	<span className='border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide'>
											{t('table.structure.notNull')}
										</span>
									}
								</td>

								<td className='px-6 py-4 text-slate-400 dark:text-slate-400 italic font-mono text-sm'>
									{col.column_default ?
										col.column_default
									:	'—'}
								</td>

								<td className='px-6 py-4 text-right'>
									<button
										title={t('table.structure.actionTitle')}
										className='text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 inline-flex items-center justify-center'>
										<MoreVertical size={16} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default TableStructure
