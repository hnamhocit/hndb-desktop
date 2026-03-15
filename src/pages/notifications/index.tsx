import {
	AlertTriangleIcon,
	BellIcon,
	Clock3Icon,
	MessageSquareIcon,
	NewspaperIcon,
} from 'lucide-react'
import { Link } from 'react-router'

import MockDataNotice from '@/components/MockDataNotice'
import { NotificationType, notificationItems } from '@/lib/community'

const typeBadgeStyles: Record<NotificationType, string> = {
	system:
		'border border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
	problem:
		'border border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
	blog: 'border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
	mention:
		'border border-fuchsia-600/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
}

const getTypeLabel = (type: NotificationType) => {
	switch (type) {
		case 'system':
			return 'System'
		case 'problem':
			return 'Problem'
		case 'blog':
			return 'Blog'
		case 'mention':
			return 'Mention'
		default:
			return 'Notification'
	}
}

const getTypeIcon = (type: NotificationType) => {
	switch (type) {
		case 'system':
			return <AlertTriangleIcon size={14} />
		case 'problem':
			return <MessageSquareIcon size={14} />
		case 'blog':
			return <NewspaperIcon size={14} />
		case 'mention':
			return <BellIcon size={14} />
		default:
			return <BellIcon size={14} />
	}
}

export default function NotificationsPage() {
	const unreadCount = notificationItems.filter((item) => !item.isRead).length

	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<MockDataNotice label='This notifications page is in beta preview and currently uses fake data.' />

			<div className='mt-3 rounded-xl border p-5 md:p-6'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<h1 className='text-3xl font-bold tracking-tight'>
						Notifications
					</h1>
					<span className='inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white'>
						Beta Preview
					</span>
				</div>
				<p className='mt-2 text-sm text-muted-foreground'>
					Follow updates from problems, mentions, blog posts, and
					system events in one place.
				</p>
			</div>

			<div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
				<div className='rounded-xl border p-4'>
					<div className='text-xs text-muted-foreground'>Unread</div>
					<div className='mt-1 text-2xl font-bold'>{unreadCount}</div>
				</div>
				<div className='rounded-xl border p-4'>
					<div className='text-xs text-muted-foreground'>
						Total notifications
					</div>
					<div className='mt-1 text-2xl font-bold'>
						{notificationItems.length}
					</div>
				</div>
				<div className='rounded-xl border p-4'>
					<div className='text-xs text-muted-foreground'>
						Preview status
					</div>
					<div className='mt-1 text-sm font-medium text-amber-700 dark:text-amber-300'>
						UI only, backend syncing is not connected yet.
					</div>
				</div>
			</div>

			<div className='mt-4 space-y-3'>
				{notificationItems.map((item) => (
					<article
						key={item.id}
						className={
							item.isRead ?
								'rounded-xl border bg-card p-4'
							:	'rounded-xl border border-blue-500/40 bg-blue-500/5 p-4'
						}>
						<div className='flex items-start gap-3'>
							<div className='mt-0.5 inline-flex size-8 items-center justify-center rounded-full border'>
								{getTypeIcon(item.type)}
							</div>

							<div className='min-w-0 flex-1'>
								<div className='flex flex-wrap items-center gap-2'>
									<h2 className='text-sm font-semibold'>
										{item.title}
									</h2>
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadgeStyles[item.type]}`}>
										{getTypeLabel(item.type)}
									</span>
									{!item.isRead && (
										<span className='inline-flex items-center rounded-full border border-blue-600/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300'>
											New
										</span>
									)}
								</div>

								<p className='mt-1 text-sm text-muted-foreground'>
									{item.message}
								</p>

								<div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
									<span className='inline-flex items-center gap-1'>
										<Clock3Icon size={12} />
										{item.createdAt}
									</span>

									{item.actionUrl && (
										<Link
											to={item.actionUrl}
											className='font-medium text-primary hover:underline'>
											Open detail
										</Link>
									)}
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</div>
	)
}
