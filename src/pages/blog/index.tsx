import { ArrowRightIcon, Clock3Icon, HeartIcon } from 'lucide-react'
import { Link } from 'react-router'

import MockDataNotice from '@/components/MockDataNotice'
import { blogPosts } from '@/lib/community'

export default function BlogPage() {
	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<MockDataNotice />

			<div className='mt-3 rounded-xl border p-5 md:p-6'>
				<h1 className='text-3xl font-bold tracking-tight'>
					Engineering Blog
				</h1>
				<p className='mt-2 text-sm text-muted-foreground'>
					Deep dives, incidents, migrations, and battle-tested SQL
					patterns from the community.
				</p>
			</div>

			<div className='mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{blogPosts.map((post) => (
					<Link
						key={post.slug}
						to={`/blog/${post.slug}`}
						className='group rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10'>
						<div className='overflow-hidden rounded-lg'>
							<img
								src={post.thumbnailUrl}
								alt={post.title}
								width={1200}
								height={700}
								className='h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105'
							/>
						</div>

						<div className='mt-4 flex items-start justify-between gap-3'>
							<h2 className='text-xl font-semibold leading-snug group-hover:text-primary transition-colors'>
								{post.title}
							</h2>
							<ArrowRightIcon className='mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity' />
						</div>

						<p className='mt-3 text-sm text-muted-foreground leading-relaxed'>
							{post.excerpt}
						</p>

						<div className='mt-4 flex flex-wrap gap-2'>
							{post.tags.map((tag) => (
								<span
									key={tag}
									className='rounded-md border px-2 py-0.5 text-xs font-medium'>
									#{tag}
								</span>
							))}
						</div>

						<div className='mt-4 flex items-center gap-4 text-xs text-muted-foreground'>
							<span>{post.authorName}</span>
							<span>{post.publishedAt}</span>
							<span className='inline-flex items-center gap-1'>
								<Clock3Icon size={12} />
								{post.readMinutes} min
							</span>
							<span className='inline-flex items-center gap-1'>
								<HeartIcon size={12} />
								{post.likes}
							</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}
