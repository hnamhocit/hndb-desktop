import { CheckCircle2Icon, MessageSquareIcon, TrendingUpIcon } from 'lucide-react'
import { Link } from 'react-router'

import MockDataNotice from '@/components/MockDataNotice'
import { problemPosts } from '@/lib/community'

export default function ProblemsPage() {
	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<MockDataNotice />

			<div className='mt-3 rounded-xl border p-5 md:p-6'>
				<h1 className='text-3xl font-bold tracking-tight'>
					Problems Community
				</h1>
				<p className='mt-2 text-sm text-muted-foreground'>
					Ask technical questions, help others, and mark a problem as
					resolved when the owner accepts the answer.
				</p>
			</div>

			<div className='mt-4 space-y-3'>
				{problemPosts.map((problem) => (
					<Link
						key={problem.id}
						to={`/problems/${problem.id}`}
						className='group block rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30'>
						<div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
							<div className='min-w-0'>
								<div className='flex items-center gap-2 text-xs'>
									<span
										className={
											problem.isResolved ?
												'inline-flex items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-600'
											:	'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground'
										}>
										{problem.isResolved && (
											<CheckCircle2Icon size={12} />
										)}
										{problem.isResolved ?
											'Resolved'
										:	'Open'}
									</span>
									<span className='text-muted-foreground'>
										Owner: {problem.ownerName}
									</span>
									<span className='text-muted-foreground'>
										{problem.createdAt}
									</span>
								</div>

								<h2 className='mt-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors'>
									{problem.title}
								</h2>
								<p className='mt-1 text-sm text-muted-foreground'>
									{problem.summary}
								</p>

								<div className='mt-3 flex flex-wrap gap-2'>
									{problem.tags.map((tag) => (
										<span
											key={tag}
											className='rounded-md border px-2 py-0.5 text-xs font-medium'>
											#{tag}
										</span>
									))}
								</div>
							</div>

							<div className='grid shrink-0 grid-cols-3 gap-2 text-xs lg:min-w-52'>
								<div className='rounded-md border p-2 text-center'>
									<div className='text-muted-foreground'>
										Votes
									</div>
									<div className='mt-1 font-semibold'>
										{problem.votes}
									</div>
								</div>
								<div className='rounded-md border p-2 text-center'>
									<div className='text-muted-foreground inline-flex items-center gap-1'>
										<MessageSquareIcon size={12} />
										Answers
									</div>
									<div className='mt-1 font-semibold'>
										{problem.answers.length}
									</div>
								</div>
								<div className='rounded-md border p-2 text-center'>
									<div className='text-muted-foreground inline-flex items-center gap-1'>
										<TrendingUpIcon size={12} />
										Views
									</div>
									<div className='mt-1 font-semibold'>
										{problem.views}
									</div>
								</div>
							</div>
						</div>

						{problem.isResolved && (
							<div className='mt-3 text-xs text-emerald-600'>
								Resolved by owner marking best answer from{' '}
								{problem.resolvedByName}
							</div>
						)}
					</Link>
				))}
			</div>
		</div>
	)
}
