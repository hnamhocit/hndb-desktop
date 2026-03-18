'use client'

import {
	CalendarDaysIcon,
	Clock3Icon,
	KeyboardIcon,
	MapPinIcon,
	MoonIcon,
	SunIcon,
	SunsetIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import QueryBuilder from '@/components/QueryBuilder'
import TableDetail from '@/components/TableDetail'
import { useActiveTab, useI18n } from '@/hooks'

export default function Home() {
	const activeTab = useActiveTab()
	const { t, language } = useI18n()
	const [now, setNow] = useState(() => new Date())
	const hour = now.getHours()
	const greeting =
		hour < 12 ?
			t('home.greetingMorning')
		: hour < 18 ?
			t('home.greetingAfternoon')
		:	t('home.greetingEvening')
	const subtitle =
		hour < 12 ?
			t('home.subtitleMorning')
		: hour < 18 ?
			t('home.subtitleAfternoon')
		:	t('home.subtitleEvening')
	const Icon =
		hour < 12 ? SunIcon
		: hour < 18 ? SunsetIcon
		: MoonIcon
	const locale = language === 'vi' ? 'vi-VN' : 'en-US'
	const timeLabel = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				hour: '2-digit',
				minute: '2-digit',
			}).format(now),
		[now, locale],
	)
	const dateLabel = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				weekday: 'long',
				day: '2-digit',
				month: 'long',
				year: 'numeric',
			}).format(now),
		[now, locale],
	)
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
	const regionLabel = timeZone.replace(/_/g, ' ')

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(new Date())
		}, 60_000)

		return () => window.clearInterval(timer)
	}, [])

	return (
		!activeTab ?
			<div className='flex h-full items-center justify-center px-6 py-8'>
				<div className='w-full max-w-2xl rounded-[28px] bg-background/95 p-8'>
					<div className='flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between'>
						<div className='space-y-4'>
							<div className='inline-flex items-center gap-3 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground'>
								<Icon className='h-4 w-4 text-primary' />
								<span>{greeting}</span>
							</div>

							<div>
								<p className='text-3xl font-semibold tracking-tight text-foreground'>
									{timeLabel}
								</p>
								<p className='mt-2 text-sm text-muted-foreground'>
									{subtitle}
								</p>
							</div>

							<div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
								<div className='inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5'>
									<CalendarDaysIcon className='h-4 w-4' />
									<span className='capitalize'>{dateLabel}</span>
								</div>
								<div className='inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5'>
									<Clock3Icon className='h-4 w-4' />
									<span>{timeLabel}</span>
								</div>
								<div className='inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5'>
									<MapPinIcon className='h-4 w-4' />
									<span>{regionLabel}</span>
								</div>
							</div>
						</div>

						<div className='min-w-0 rounded-2xl border border-border/70 bg-muted/35 p-4 sm:w-80'>
							<div className='flex items-center gap-2 text-sm font-medium text-foreground'>
								<KeyboardIcon className='h-4 w-4 text-primary' />
								<span>{t('home.quickActions')}</span>
							</div>
							<div className='mt-4 space-y-2 text-sm'>
								{[
									[t('home.actionNewQuery'), '+'],
									[t('home.actionSwitchTab'), 'Alt + [ ]'],
									[t('home.actionRunQuery'), 'Cmd/Ctrl + Enter'],
									[t('home.actionFocusSidebar'), 'Cmd/Ctrl + B'],
								].map(([label, shortcut]) => (
									<div
										key={label}
										className='flex items-center justify-between gap-4 rounded-xl bg-background px-3 py-2 text-muted-foreground'>
										<span className='min-w-0 flex-1'>{label}</span>
										<span className='shrink-0 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground'>
											{shortcut}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		: activeTab.type === 'query' ? <QueryBuilder />
		: activeTab.type === 'table' ? <TableDetail />
		: <div>Unknown tab type</div>
	)
}
