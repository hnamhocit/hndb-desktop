import { ArrowLeftIcon, CheckCircle2Icon, MessageSquareIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import MockDataNotice from '@/components/MockDataNotice'
import { problemPosts } from '@/lib/community'

export default function ProblemDetailPage() {
	const { problem_id } = useParams<{ problem_id: string }>()
	const problem = problemPosts.find((item) => item.id === problem_id)

	if (!problem) {
		return (
			<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
				<div className='rounded-xl border p-6 text-sm text-muted-foreground'>
					Problem not found.
				</div>
			</div>
		)
	}

	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8 space-y-4'>
			<MockDataNotice label='This problem thread and answers are mock/fake data for beta demonstration.' />

			<Link
				to='/problems'
				className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
				<ArrowLeftIcon size={14} />
				Back to problems
			</Link>

			<div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
				<span
					className={
						problem.isResolved ?
							'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600'
						:	'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground'
					}>
					{problem.isResolved && <CheckCircle2Icon size={12} />}
					{problem.isResolved ? 'Resolved' : 'Open'}
				</span>
				<span className='text-muted-foreground'>
					Asked by {problem.ownerName} • {problem.createdAt}
				</span>
			</div>

			<h1 className='text-3xl font-bold tracking-tight leading-tight'>
				{problem.title}
			</h1>
			<p className='text-sm leading-7 text-foreground/90'>
				{problem.description}
			</p>

			<div className='flex flex-wrap gap-2'>
				{problem.tags.map((tag) => (
					<span
						key={tag}
						className='rounded-md bg-muted px-2 py-0.5 text-xs font-medium'>
						#{tag}
					</span>
				))}
			</div>

			<div className='text-xs text-muted-foreground'>
				Resolution rule: owner marks one answer as accepted to close the
				problem.
			</div>

			<div className='pt-2'>
				<div className='flex items-center gap-2'>
					<MessageSquareIcon size={16} />
					<h2 className='text-lg font-semibold'>
						Answers ({problem.answers.length})
					</h2>
				</div>

				<div className='mt-4 space-y-3'>
					{problem.answers.map((answer) => (
						<div
							key={answer.id}
							className='rounded-md bg-muted/50 p-3'>
							<div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
								<div>
									{answer.authorName} • {answer.createdAt}
								</div>
								<div className='flex items-center gap-2'>
									<span>Votes: {answer.votes}</span>
									{answer.isAccepted && (
										<span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600'>
											<CheckCircle2Icon size={12} />
											Accepted by owner
										</span>
									)}
								</div>
							</div>
							<p className='mt-2 text-sm leading-6'>
								{answer.content}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
