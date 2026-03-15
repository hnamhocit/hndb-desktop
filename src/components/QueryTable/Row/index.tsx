interface RowProps {
	i: number
	columns: string[]
	row: Record<string, unknown>
}

const Row = ({ i, columns, row }: RowProps) => {
	return (
		<tr className='odd:bg-primary/5 hover:bg-primary/10 transition-colors duration-150'>
			<td className='border p-2 select-none text-neutral-500 font-mono text-center'>
				<div className='flex items-center justify-center gap-4'>
					<span className='min-w-5'>{i + 1}</span>
				</div>
			</td>

			{columns.map((col) => (
				<td
					key={col}
					className='border p-2 select-none text-neutral-600 font-mono dark:text-neutral-400'>
					{row[col] === null ?
						<span className='italic text-neutral-400'>[NULL]</span>
					:	String(row[col])}
				</td>
			))}
		</tr>
	)
}

export default Row
