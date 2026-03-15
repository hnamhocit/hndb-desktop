'use client'

import {
	BadgeCheckIcon,
	FlameIcon,
	GitPullRequestArrowIcon,
	MedalIcon,
	Share2Icon,
	StarIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { IUser } from '@/interfaces'
import { blogPosts, problemPosts } from '@/lib/community'
import { usersService } from '@/services'
import { notifyError } from '@/utils'

const badges = [
	'Query Tuner',
	'Schema Architect',
	'SQL Night Owl',
	'Data Janitor',
	'Index Hunter',
]

const activities = [
	'Published engineering blog on index regressions',
	'Helped debug JOIN duplication and got accepted answer',
	'Reached 14-day login streak',
	'Unlocked "Schema Architect" badge',
]

interface UserProfileClientProps {
	userId: string
}

export default function UserProfileClient({ userId }: UserProfileClientProps) {
	const [user, setUser] = useState<IUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!userId) {
			setIsLoading(false)
			return
		}

		let isMounted = true

		;(async () => {
			try {
				setIsLoading(true)

				const { data, error } = await usersService.getUserById(userId)

				if (error) {
					toast.error(error.message, { position: 'top-center' })
					return
				}

				if (isMounted) {
					setUser(data ?? null)
				}
			} catch (error) {
				notifyError(error, 'Failed to load user profile')
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		})()

		return () => {
			isMounted = false
		}
	}, [userId])

	const safeUserId = user?.id || userId || 'unknown'
	const shortId = safeUserId.slice(0, 8)

	const displayName = user?.name?.trim() || `Engineer ${shortId}`
	const displayEmail = user?.email?.trim() || `@${safeUserId}`
	const avatarSrc = user?.photo_url || '/resources/default-user.jpg'

	const authoredBlogCount = useMemo(() => {
		return blogPosts.filter((post) => post.authorId === safeUserId).length
	}, [safeUserId])

	const helpedResolvedCount = useMemo(() => {
		return problemPosts.filter(
			(problem) =>
				problem.isResolved && problem.resolvedById === safeUserId,
		).length
	}, [safeUserId])

	if (isLoading) {
		return (
			<div className='h-full overflow-auto'>
				<div className='mx-auto max-w-6xl p-4 md:p-8'>
					<div className='rounded-2xl border p-6 text-sm text-muted-foreground'>
						Loading user profile...
					</div>
				</div>
			</div>
		)
	}

	if (!user && !userId) {
		return (
			<div className='h-full overflow-auto'>
				<div className='mx-auto max-w-6xl p-4 md:p-8'>
					<div className='rounded-2xl border p-6 text-sm text-destructive'>
						Invalid user id.
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='h-full overflow-auto'>
			<div className='mx-auto max-w-6xl p-4 md:p-8 space-y-6'>
				<div className='rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 md:p-8 shadow-sm'>
					<div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
						<div className='flex items-center gap-4'>
							<div className='relative'>
								<img
									src={avatarSrc}
									alt={`${displayName} avatar`}
									width={80}
									height={80}
									className='rounded-xl border object-cover'
								/>
								<div className='absolute -bottom-2 -right-2 rounded-md border bg-background px-2 py-0.5 text-xs font-semibold'>
									Lv.12
								</div>
							</div>

							<div>
								<div className='text-2xl font-bold tracking-tight'>
									{displayName}
								</div>

								<div className='text-sm text-muted-foreground'>
									{displayEmail}
								</div>

								<div className='mt-1 text-xs text-muted-foreground'>
									ID: {shortId}
								</div>

								<div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
									<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5'>
										<FlameIcon size={12} />
										14-day streak
									</span>
									<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5'>
										<MedalIcon size={12} />
										Global Rank #128
									</span>
									<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5'>
										<BadgeCheckIcon size={12} />
										Open profile
									</span>
								</div>
							</div>
						</div>

						<div className='flex items-center gap-2'>
							<Button variant='outline'>
								<Share2Icon />
								Share profile
							</Button>
							<Button>
								<GitPullRequestArrowIcon />
								Follow
							</Button>
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<Card>
						<CardHeader>
							<CardDescription>Blogs Published</CardDescription>
							<CardTitle className='text-3xl'>
								{authoredBlogCount}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card>
						<CardHeader>
							<CardDescription>Problems Helped</CardDescription>
							<CardTitle className='text-3xl'>
								{helpedResolvedCount}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card>
						<CardHeader>
							<CardDescription>Community Stars</CardDescription>
							<CardTitle className='text-3xl flex items-center gap-2'>
								<StarIcon className='text-amber-500' />
								245
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>Activity Timeline</CardTitle>
							<CardDescription>
								Recent engineering signals and contributions.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<ul className='space-y-3 text-sm'>
								{activities.map((activity) => (
									<li
										key={activity}
										className='rounded-md border px-3 py-2'>
										{activity}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Badges</CardTitle>
							<CardDescription>
								Custom badge slots ready for expansion.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<div className='flex flex-wrap gap-2'>
								{badges.map((badge) => (
									<span
										key={badge}
										className='rounded-md border bg-primary/5 px-2 py-1 text-xs font-medium'>
										{badge}
									</span>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
