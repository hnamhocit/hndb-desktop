import { ArrowLeftIcon, Clock3Icon, HeartIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import MockDataNotice from '@/components/MockDataNotice'
import { blogDetails, blogPosts } from '@/lib/community'

export default function BlogDetailPage() {
	const { slug } = useParams<{ slug: string }>()
	const post = blogPosts.find((item) => item.slug === slug)

	if (!post) {
		return (
			<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
				<div className='rounded-xl border p-6 text-sm text-muted-foreground'>
					Blog post not found.
				</div>
			</div>
		)
	}

	const content = blogDetails[post.slug] || []

	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<MockDataNotice label='This blog post content is mock/fake data for beta demonstration.' />

			<Link
				to='/blog'
				className='mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
				<ArrowLeftIcon size={14} />
				Back to blog
			</Link>

			<h1 className='mt-4 text-3xl font-bold tracking-tight leading-tight'>
				{post.title}
			</h1>

			<div className='mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
				<span>{post.authorName}</span>
				<span>{post.publishedAt}</span>
				<span className='inline-flex items-center gap-1'>
					<Clock3Icon size={12} />
					{post.readMinutes} min read
				</span>
				<span className='inline-flex items-center gap-1'>
					<HeartIcon size={12} />
					{post.likes}
				</span>
			</div>

			<div className='mt-5 overflow-hidden rounded-xl'>
				<img
					src={post.thumbnailUrl}
					alt={post.title}
					width={1200}
					height={700}
					className='h-[340px] w-full object-cover'
				/>
			</div>

			<div className='mt-4 flex flex-wrap gap-2'>
				{post.tags.map((tag) => (
					<span
						key={tag}
						className='rounded-md bg-muted px-2 py-0.5 text-xs font-medium'>
						#{tag}
					</span>
				))}
			</div>

			<div className='mt-6 space-y-4 text-sm leading-7 text-foreground/90'>
				{content.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>
		</div>
	)
}
