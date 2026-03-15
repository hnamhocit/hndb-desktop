import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

interface JsonViewerProps {
	data: any
	name?: string
	isLast?: boolean
	initiallyExpanded?: boolean
}

const JsonViewer = ({
	data,
	name,
	isLast = true,
	initiallyExpanded = true,
}: JsonViewerProps) => {
	const [isExpanded, setIsExpanded] = useState(initiallyExpanded)

	const isObject = data !== null && typeof data === 'object'
	const isArray = Array.isArray(data)

	// Render giá trị nguyên thủy (String, Number, Boolean, Null) với màu sắc riêng
	if (!isObject) {
		let valueColor = 'text-green-600 dark:text-green-400' // String
		let formattedValue = `"${data}"`

		if (typeof data === 'number') {
			valueColor = 'text-orange-500 dark:text-orange-400'
			formattedValue = String(data)
		} else if (typeof data === 'boolean') {
			valueColor = 'text-pink-600 dark:text-pink-400'
			formattedValue = data ? 'true' : 'false'
		} else if (data === null) {
			valueColor = 'text-slate-400 dark:text-slate-500 italic'
			formattedValue = 'null'
		}

		return (
			<div className='flex pl-4 font-mono text-sm leading-relaxed'>
				{name && (
					<span className='text-blue-600 dark:text-blue-400 mr-1'>
						"{name}":
					</span>
				)}
				<span className={valueColor}>{formattedValue}</span>
				{!isLast && <span className='text-slate-500'>,</span>}
			</div>
		)
	}

	// Nếu là Object hoặc Array
	const keys = Object.keys(data)
	const isEmpty = keys.length === 0
	const bracketOpen = isArray ? '[' : '{'
	const bracketClose = isArray ? ']' : '}'

	return (
		<div className='font-mono text-sm leading-relaxed'>
			<div
				className='flex items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded px-1 -ml-1 w-max transition-colors'
				onClick={() => !isEmpty && setIsExpanded(!isExpanded)}>
				{/* Icon đóng/mở */}
				{
					!isEmpty ?
						isExpanded ?
							<ChevronDownIcon
								size={14}
								className='text-slate-400 mr-1 shrink-0'
							/>
						:	<ChevronRightIcon
								size={14}
								className='text-slate-400 mr-1 shrink-0'
							/>

					:	<span className='w-4.5' /> // Spacer nếu rỗng
				}

				{/* Tên Key (Nếu có) */}
				{name && (
					<span className='text-blue-600 dark:text-blue-400 mr-1'>
						&quot;{name}&quot;:
					</span>
				)}

				{/* Dấu mở ngoặc */}
				<span className='text-slate-500'>{bracketOpen}</span>

				{/* Nếu đang đóng, hiển thị preview số lượng item */}
				{!isExpanded && !isEmpty && (
					<span className='text-slate-400 italic mx-2 text-xs'>
						{isArray ?
							`${keys.length} items`
						:	`${keys.length} keys`}
					</span>
				)}

				{/* Dấu đóng ngoặc ngay trên cùng 1 dòng nếu đang gập hoặc rỗng */}
				{(!isExpanded || isEmpty) && (
					<>
						<span className='text-slate-500'>{bracketClose}</span>
						{!isLast && <span className='text-slate-500'>,</span>}
					</>
				)}
			</div>

			{/* Render đệ quy các con bên trong nếu đang mở */}
			{isExpanded && !isEmpty && (
				<div className='pl-4 border-l border-slate-200 dark:border-slate-800 ml-[6px]'>
					{keys.map((key, index) => (
						<JsonViewer
							key={key}
							name={isArray ? undefined : key}
							data={data[key as keyof typeof data]}
							isLast={index === keys.length - 1}
							initiallyExpanded={false} // Mặc định gập các node con để đỡ rối
						/>
					))}
				</div>
			)}

			{/* Dấu đóng ngoặc nằm ở dòng dưới cùng nếu đang mở */}
			{isExpanded && !isEmpty && (
				<div className='pl-4'>
					<span className='text-slate-500'>{bracketClose}</span>
					{!isLast && <span className='text-slate-500'>,</span>}
				</div>
			)}
		</div>
	)
}

export default JsonViewer
