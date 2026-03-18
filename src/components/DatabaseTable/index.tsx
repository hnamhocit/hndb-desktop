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

const getRowKey = (
	row: TableRow,
	primaryColumnName: string,
	fallbackIndex: number,
) => {
	const candidate = row.__tempId ?? row[primaryColumnName]

	if (candidate === null || candidate === undefined || candidate === '') {
		return `row-${fallbackIndex}`
	}

	return String(candidate)
}

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

		const mergedOriginal: TableRow[] = originalData.map((row, rowIndex) => {
			const rowId = getRowKey(row, primaryColumnName, rowIndex)
			return updateChangeset[rowId] ?
					{ ...row, ...updateChangeset[rowId] }
				:	row
		})

		return [...newRows, ...mergedOriginal]
	}, [tableState, initialData, primaryColumnName])

	const tableColumns = useMemo<ColumnDef<TableRow>[]>(() => {
		const dataCols = columns.map<ColumnDef<TableRow>>((col) => {
			const { icon: Icon } = getTypeInfo(col.data_type)

			return {
				id: col.column_name,
				accessorKey: col.column_name,
				minSize: col.column_name.length * 12 + 50,
				size: 150,
				maxSize: 500,
				header: () => (
					<div className='flex flex-col items-start gap-1 text-left'>
						<div className='text-base font-semibold leading-none'>
							{col.column_name}
						</div>
						<div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
							<Icon size={15} />
							<div>
								{col.data_type}
							</div>
						</div>
					</div>
				),
				cell: ({ row, getValue }) => {
					const val = getValue()
					const rowId = getRowKey(
						row.original,
						primaryColumnName,
						row.index,
					)
					const isNewRow = !!row.original.__tempId

					return (
						<CellWrapper
							rowId={rowId}
							column={col}
							initialValue={val}
							tablePath={tablePath}
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
					const rowId = getRowKey(
						row.original,
						primaryColumnName,
						row.index,
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
		getRowId: (row, index) => getRowKey(row, primaryColumnName, index),
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
		enabled: !!onLoadMore && displayData.length > 0,
	})

	return (
		<div
			ref={parentRef}
			className='relative h-full w-full overflow-auto bg-background'>
			<table className='w-full border-separate border-spacing-0 whitespace-nowrap'>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className='sticky top-0 z-20 border-b border-r border-border/70 bg-background px-3 py-3 text-foreground align-bottom select-none backdrop-blur supports-[backdrop-filter]:bg-background/95'>
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

						const currentRowId = getRowKey(
							row.original,
							primaryColumnName,
							row.index,
						)
						const isDeleted =
							tableState?.deleteChangeset?.[currentRowId]

						return (
							<tr
								key={row.id}
								className={clsx(
									'group transition-colors duration-150 odd:[&>td]:bg-muted/20 even:[&>td]:bg-background hover:[&>td]:bg-primary/[0.045]',
									isDeleted &&
										'[&>td]:bg-red-100/80 dark:[&>td]:bg-red-950/30 opacity-70',
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
											className='overflow-hidden border-b border-r border-border/60 p-0 align-top text-ellipsis select-none'>
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
