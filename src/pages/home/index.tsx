'use client'

import {
	CalendarDaysIcon,
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
				: t('home.greetingEvening')
	const subtitle =
		hour < 12 ?
			t('home.subtitleMorning')
			: hour < 18 ?
				t('home.subtitleAfternoon')
				: t('home.subtitleEvening')
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
			<div className='flex h-full items-center justify-center px-4 sm:px-6 xl:px-8 py-6 xl:py-8'>
				<div className='w-full max-w-[56rem] rounded-3xl bg-background/95 p-5 sm:p-6 xl:p-8'>
					<div className='grid items-start gap-5 xl:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
						<div className='space-y-4'>
							<div className='inline-flex items-center gap-2.5 rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs xl:text-sm text-muted-foreground'>
								<Icon className='h-4 w-4 text-primary' />
								<span>{greeting}</span>
							</div>

							<div>
								<p className='text-2xl xl:text-3xl font-semibold tracking-tight text-foreground'>
									{timeLabel}
								</p>
								<p className='mt-1.5 xl:mt-2 text-xs xl:text-sm text-muted-foreground'>
									{subtitle}
								</p>
							</div>

							<div className='flex flex-wrap items-center gap-2.5 text-xs xl:text-sm text-muted-foreground'>
								<div className='inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 xl:px-3 py-1.5'>
									<CalendarDaysIcon className='h-3.5 w-3.5 xl:h-4 xl:w-4' />
									<span className='capitalize'>{dateLabel}</span>
								</div>

								<div className='inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 xl:px-3 py-1.5'>
									<MapPinIcon className='h-3.5 w-3.5 xl:h-4 xl:w-4' />
									<span>{regionLabel}</span>
								</div>
							</div>
						</div>

						<div className='min-w-0 rounded-2xl border border-border/70 bg-muted/35 p-3.5 xl:p-4 xl:w-80'>
							<div className='flex items-center gap-2 text-xs xl:text-sm font-medium text-foreground'>
								<KeyboardIcon className='h-4 w-4 text-primary' />
								<span>{t('home.quickActions')}</span>
							</div>
							<div className='mt-3 xl:mt-4 space-y-1.5 xl:space-y-2 text-xs xl:text-sm'>
								{[
									[t('home.actionNewQuery'), '+'],
									[t('home.actionSwitchTab'), 'Alt + [ ]'],
									[t('home.actionRunQuery'), 'Cmd/Ctrl + Enter'],
									[t('home.actionQuickSearch'), 'Cmd/Ctrl + K'],
								].map(([label, shortcut]) => (
									<div
										key={label}
										className='flex items-center justify-between gap-3 rounded-xl bg-background px-2.5 xl:px-3 py-1.5 xl:py-2 text-muted-foreground'>
										<span className='min-w-0 flex-1'>{label}</span>
										<span className='shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 xl:py-1 text-[11px] xl:text-xs font-medium text-foreground'>
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
					: <div>{t('home.unknownTabType')}</div>
	)
}
