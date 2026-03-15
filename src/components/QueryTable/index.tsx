import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

import Row from './Row'

interface QueryTableProps {
	columns: string[]
	rows: Record<string, unknown>[]
}

const QueryTable = ({ columns, rows }: QueryTableProps) => {
	// 1. Tham chiếu đến container có thanh cuộn
	const parentRef = useRef<HTMLDivElement>(null)

	// 2. Cài đặt Virtualizer
	const rowVirtualizer = useVirtualizer({
		count: rows?.length || 0,
		getScrollElement: () => parentRef.current,
		// Chiều cao ước tính của 1 dòng (giúp thanh scrollbar tính toán độ dài)
		estimateSize: () => 40,
		// Load dư ra 10 dòng trên/dưới để khi cuộn nhanh không bị chớp trắng
		overscan: 10,
	})

	const virtualItems = rowVirtualizer.getVirtualItems()

	// 3. Tính toán 2 cục đệm (Padding) ảo để đẩy các dòng data vào đúng vị trí hiển thị
	const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0
	const paddingBottom =
		virtualItems.length > 0 ?
			rowVirtualizer.getTotalSize() -
			(virtualItems[virtualItems.length - 1]?.end || 0)
		:	0

	return (
		<div
			ref={parentRef}
			className='w-full h-full min-h-0 overflow-auto relative'>
			<table className='w-full min-w-max border-collapse whitespace-nowrap'>
				<thead>
					<tr>
						<th className='border p-2 sticky top-0 bg-primary z-20 text-primary-foreground'>
							#
						</th>

						{columns.map((col) => (
							<th
								key={col}
								className='border p-2 text-left select-none sticky top-0 bg-primary text-primary-foreground z-20'>
								<div className='text-lg font-semibold'>
									{col}
								</div>
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{/* Spacer Top: Đẩy nội dung xuống đúng đoạn đang scroll */}
					{paddingTop > 0 && (
						<tr>
							<td
								style={{ height: `${paddingTop}px` }}
								colSpan={columns.length + 1}
							/>
						</tr>
					)}

					{/* Chỉ Map và Render những dòng lọt vào khung nhìn (Viewport) */}
					{virtualItems.map((virtualRow) => {
						const row = rows[virtualRow.index]

						return (
							<Row
								key={virtualRow.index}
								columns={columns}
								row={row}
								i={virtualRow.index}
							/>
						)
					})}

					{/* Spacer Bottom: Kéo dài thanh cuộn cho khớp tổng số dòng */}
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
		</div>
	)
}

export default QueryTable
