import { clsx } from 'clsx'

import { Checkbox } from '@/components/ui/checkbox'
import { useDataEditorStore } from '@/stores'

interface SelectionCellProps {
	rowId: string
	index: number
	tablePath: string
	isDeleted?: boolean
}

const SelectionCell = ({
	rowId,
	index,
	tablePath,
	isDeleted,
}: SelectionCellProps) => {
	const isSelected = useDataEditorStore(
		(state) => !!state.tablesState[tablePath]?.selectedRows?.[rowId],
	)
	const toggleRowSelection = useDataEditorStore(
		(state) => state.toggleRowSelection,
	)

	return (
		<div
			className={clsx(
				'flex items-center justify-center w-full h-full min-h-11 transition-colors',
				isSelected && !isDeleted ? 'bg-primary/10' : '',
			)}>
			<div className='flex items-center justify-center gap-2 px-2 w-full'>
				{/* 💡 NÚT CHECKBOX: Mặc định tàng hình (opacity-0).
                    Chỉ hiện lên (opacity-100) khi:
                    1. Người dùng hover vào bất kỳ đâu trên dòng này (group-hover)
                    2. Hoặc Checkbox này đang được tick chọn (isSelected)
                    3. Hoặc dòng này đã bị bấm xóa (isDeleted)
                */}
				<div
					className={clsx(
						'transition-opacity duration-200 flex shrink-0 items-center',
						isSelected || isDeleted ? 'opacity-100' : (
							'opacity-0 group-hover:opacity-100'
						),
					)}>
					<Checkbox
						checked={isSelected}
						disabled={isDeleted}
						onCheckedChange={() =>
							!isDeleted && toggleRowSelection(tablePath, rowId)
						}
						className='bg-background/70 dark:bg-input/40'
					/>
				</div>

				{/* SỐ THỨ TỰ INDEX */}
				<span
					className={clsx(
						'text-right min-w-[1.2rem]',
						isDeleted ?
							'text-neutral-400 dark:text-neutral-500'
						:	'text-neutral-500 dark:text-neutral-300',
					)}>
					{index + 1}
				</span>
			</div>
		</div>
	)
}

export default SelectionCell
