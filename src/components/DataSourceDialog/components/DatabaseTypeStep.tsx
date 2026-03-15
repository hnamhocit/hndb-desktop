import { supportDataSources } from '@/constants/supportDataSources'
import type { DataSourceType } from '@/schemas'

interface DatabaseTypeStepProps {
	onSelectDatabase: (type: DataSourceType) => void
}

const DatabaseTypeStep = ({ onSelectDatabase }: DatabaseTypeStepProps) => {
	return (
		<div className='grid grid-cols-3 gap-3 px-6 py-6 sm:gap-4'>
			{supportDataSources.map((dataSource) => (
				<button
					key={dataSource.id}
					type='button'
					onClick={() =>
						onSelectDatabase(dataSource.id as DataSourceType)
					}
					className='group flex min-h-36 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5'>
					<div className='flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm'>
						<img
							src={dataSource.photoURL || '/logo.png'}
							alt={dataSource.name}
							width={32}
							height={40}
							className='object-contain transition-transform duration-200 group-hover:scale-110'
						/>
					</div>

					<p className='font-medium text-foreground'>
						{dataSource.name}
					</p>
				</button>
			))}
		</div>
	)
}

export default DatabaseTypeStep
