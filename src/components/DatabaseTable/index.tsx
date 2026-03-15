import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { useMemo, useRef } from 'react'

import { useActiveTablePath, useScrollEnd } from '@/hooks'
import { IColumn } from '@/interfaces'
import { useDataEditorStore } from '@/stores'
import { getTypeInfo } from '@/utils'
import CellWrapper from './CellWrapper'
import SelectionCell from './SelectionCell'

interface DatabaseTableProps {
	columns: IColumn[]
	initialData: TableRow[]
	primaryColumnName: string
	hasMore: boolean
	isLoadingMore: boolean
	onLoadMore: () => void
}

type TableRow = Record<string, unknown>

const DatabaseTable = ({
	columns,
	initialData,
	primaryColumnName,
	hasMore = false,
	isLoadingMore = false,
	onLoadMore,
}: DatabaseTableProps) => {
	const parentRef = useRef<HTMLDivElement>(null)

	const { tablesState } = useDataEditorStore()
	const tablePath = useActiveTablePath()
	const tableState = tablesState[tablePath]

	const displayData = useMemo<TableRow[]>(() => {
		if (!tableState) return initialData

		const { originalData, updateChangeset, insertChangeset, newRowIds } =
			tableState

		const newRows: TableRow[] = newRowIds.map((id) => ({
			__tempId: id,
			...insertChangeset[id],
		}))

		const mergedOriginal: TableRow[] = originalData.map((row: TableRow) => {
			const rowId = String(row[primaryColumnName])
			return updateChangeset[rowId] ?
					{ ...row, ...updateChangeset[rowId] }
				:	row
		})

		return [...newRows, ...mergedOriginal]
	}, [tableState, initialData, primaryColumnName])

	const tableColumns = useMemo<ColumnDef<TableRow>[]>(() => {
		const dataCols = columns.map<ColumnDef<TableRow>>((col) => {
			const { icon: Icon, color } = getTypeInfo(col.data_type)

			return {
				id: col.column_name,
				accessorKey: col.column_name,
				minSize: col.column_name.length * 12 + 50,
				size: 150,
				maxSize: 500,
				header: () => (
					<div className='flex flex-col text-left'>
						<div className='text-lg font-semibold'>
							{col.column_name}
						</div>
						<div className='flex items-center gap-2 text-neutral-500 dark:text-neutral-300'>
							<Icon size={18} />
							<div className='text-sm uppercase'>
								{col.data_type}
							</div>
						</div>
					</div>
				),
				cell: ({ row, getValue }) => {
					const val = getValue()
					const rowId = String(
						row.original.__tempId ||
							row.original[primaryColumnName],
					)
					const isNewRow = !!row.original.__tempId

					return (
						<CellWrapper
							rowId={rowId}
							column={col}
							initialValue={val}
							tablePath={tablePath}
							color={color}
							isNewRow={isNewRow}
						/>
					)
				},
			}
		})

		return [
			{
				id: '_selection',
				size: 70,
				header: () => <div className='text-center font-mono'>#</div>,
				cell: ({ row }) => {
					const rowId = String(
						row.original.__tempId ||
							row.original[primaryColumnName],
					)

					const isDeleted = !!tableState?.deleteChangeset?.[rowId]

					return (
						<SelectionCell
							rowId={rowId}
							index={row.index}
							tablePath={tablePath}
							isDeleted={isDeleted}
						/>
					)
				},
			},
			...dataCols,
		]
	}, [columns, primaryColumnName, tablePath, tableState?.deleteChangeset])

	const table = useReactTable<TableRow>({
		data: displayData,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => String(row.__tempId || row[primaryColumnName]),
	})

	const { rows } = table.getRowModel()

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 45,
		overscan: 10,
	})

	const virtualItems = rowVirtualizer.getVirtualItems()

	const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0
	const paddingBottom =
		virtualItems.length > 0 ?
			rowVirtualizer.getTotalSize() -
			(virtualItems[virtualItems.length - 1]?.end || 0)
		:	0

	useScrollEnd({
		containerRef: parentRef,
		hasMore,
		isLoading: isLoadingMore,
		onEndReached: onLoadMore,
		threshold: 300,
		enabled: !!onLoadMore,
	})

	return (
		<div
			ref={parentRef}
			className='w-full h-full overflow-auto relative'>
			<table className='w-full border-collapse whitespace-nowrap'>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className='border p-2 select-none sticky top-0 z-20 bg-slate-100 text-foreground dark:bg-slate-800'>
									{header.isPlaceholder ? null : (
										flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)
									)}
								</th>
							))}
						</tr>
					))}
				</thead>

				<tbody>
					{paddingTop > 0 && (
						<tr>
							<td
								style={{ height: `${paddingTop}px` }}
								colSpan={columns.length + 1}
							/>
						</tr>
					)}

					{virtualItems.map((virtualRow) => {
						const row = rows[virtualRow.index]

						const currentRowId = String(
							row.original.__tempId ||
								row.original[primaryColumnName],
						)
						const isDeleted =
							tableState?.deleteChangeset?.[currentRowId]

						return (
							<tr
								key={row.id}
								className={clsx(
									'odd:bg-primary/5 hover:bg-primary/10 transition-colors duration-150 group',
									isDeleted &&
										'bg-red-100! dark:bg-red-950/40! opacity-70!',
								)}>
								{row.getVisibleCells().map((cell) => {
									const columnSize = cell.column.getSize()

									return (
										<td
											key={cell.id}
											style={{
												width: columnSize,
												minWidth: columnSize,
											}}
											className={clsx(
												'border select-none overflow-hidden text-ellipsis',
												(
													cell.column.id ===
														'_selection'
												) ?
													'p-0'
												:	'font-mono',
											)}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									)
								})}
							</tr>
						)
					})}

					{paddingBottom > 0 && (
						<tr>
							<td
								style={{ height: `${paddingBottom}px` }}
								colSpan={columns.length + 1}
							/>
						</tr>
					)}
				</tbody>
			</table>

			{isLoadingMore && (
				<div className='sticky bottom-0 w-full border-t bg-background/95 px-4 py-2 text-center text-sm text-muted-foreground backdrop-blur'>
					Loading more...
				</div>
			)}
		</div>
	)
}

export default DatabaseTable
