import { Handle, Position } from '@xyflow/react'
import { GripVerticalIcon, KeyIcon, LinkIcon, SettingsIcon } from 'lucide-react'

const TableNode = ({ data }: { data: any }) => {
	return (
		<div className='flex flex-col w-70 bg-white dark:bg-[#0f111a] rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-lg dark:shadow-2xl overflow-hidden transition-colors duration-300'>
			{/* Header Thẻ */}
			<div className='flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#161a27] border-b border-slate-200 dark:border-slate-700/60 cursor-move'>
				<span className='font-bold text-primary tracking-wide'>
					{data.name}
				</span>

				<div className='flex items-center gap-2 text-slate-400 dark:text-slate-500'>
					<SettingsIcon
						size={16}
						className='cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors'
					/>

					<GripVerticalIcon
						size={16}
						className='opacity-50'
					/>
				</div>
			</div>

			{/* Danh sách cột */}
			<div className='flex flex-col py-2'>
				{data.columns.map((col: any, index: number) => (
					// 🔴 Thêm relative để Handle định vị chính xác theo dòng
					<div
						key={index}
						className='relative flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 group transition-colors'>
						{/* Target Handle (Bên trái) - Nhận dây trỏ tới (Khóa chính) */}
						{col.is_primary && (
							<Handle
								type='target'
								position={Position.Left}
								id={col.column_name} // 🔴 Bắt buộc phải có id
								className='w-2 h-2 -left-[5px] bg-yellow-500 border-none opacity-0'
							/>
						)}

						<div className='flex items-center gap-3'>
							<div className='w-4 flex justify-center'>
								{col.is_primary ?
									<KeyIcon
										size={14}
										className='text-yellow-500 -rotate-45'
										fill='currentColor'
									/>
								: col.is_foreign_key ?
									<LinkIcon
										size={14}
										className='text-blue-500'
									/>
								:	<span className='w-4'></span>}
							</div>

							<span
								className={`text-sm font-medium transition-colors ${col.is_primary ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-300'}`}>
								{col.column_name}
							</span>
						</div>

						<span className='text-[11px] font-mono text-slate-400 dark:text-slate-600 uppercase'>
							{col.data_type}
						</span>

						{/* Source Handle (Bên phải) - Bắn dây đi (Khóa ngoại) */}
						{col.is_foreign_key && (
							<Handle
								type='source'
								position={Position.Right}
								id={col.column_name} // 🔴 Bắt buộc phải có id
								className='w-2 h-2 -right-[5px] bg-blue-500 border-none opacity-0'
							/>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

export default TableNode
