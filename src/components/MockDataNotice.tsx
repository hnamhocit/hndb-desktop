import { AlertTriangleIcon } from 'lucide-react'

interface MockDataNoticeProps {
	label?: string
}

const MockDataNotice = ({
	label = 'This page is using mock/fake data for beta UI preview.',
}: MockDataNoticeProps) => {
	return (
		<div className='rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'>
			<div className='flex items-center gap-2'>
				<span className='inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'>
					<AlertTriangleIcon size={12} />
					Fake Data
				</span>
				<span>{label}</span>
			</div>
		</div>
	)
}

export default MockDataNotice
