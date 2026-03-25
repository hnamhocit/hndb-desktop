'use client'

import {
	ArrowLeftIcon,
	ArrowUpRightIcon,
	BoxesIcon,
	CalendarDaysIcon,
	InfoIcon,
	PackageIcon,
	RefreshCwIcon,
	RocketIcon,
} from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks'
import {
	APP_RELEASES_URL,
	APP_REPOSITORY_URL,
	APP_TECH_STACK,
	formatReleaseDate,
} from '@/services'
import { useAppStore } from '@/stores'

export default function AboutPage() {
	const { t, language } = useI18n()
	const app = useAppStore((state) => state.app)
	const currentRelease = useAppStore((state) => state.currentRelease)
	const latestRelease = useAppStore((state) => state.latestRelease)
	const hasUpdate = useAppStore((state) => state.hasUpdate)
	const checkedAt = useAppStore((state) => state.checkedAt)
	const isCheckingForUpdates = useAppStore(
		(state) => state.isCheckingForUpdates,
	)
	const updateError = useAppStore((state) => state.updateError)
	const initializeApp = useAppStore((state) => state.initialize)
	const checkForUpdates = useAppStore((state) => state.checkForUpdates)

	const resolvedCurrentRelease =
		currentRelease ??
		(latestRelease?.version === app.version ? latestRelease : null)

	useEffect(() => {
		void initializeApp()
		void checkForUpdates({ includeCurrentRelease: true })
	}, [checkForUpdates, initializeApp])

	const handleCheckForUpdates = async () => {
		const result = await checkForUpdates({ includeCurrentRelease: true })
		if (!result) {
			toast.error(t('updates.checkFailed'))
			return
		}

		if (result.hasUpdate) {
			toast.info(
				t('updates.toastAvailable', {
					version: result.latestRelease.version,
					date: formatReleaseDate(result.latestRelease.publishedAt, language),
				}),
			)
			return
		}

		toast.success(
			t('updates.upToDate', {
				version: result.app.version,
			}),
		)
	}

	const handleOpenUrl = async (url: string) => {
		try {
			await openUrl(url)
		} catch {
			toast.error(t('updates.openReleaseFailed'))
		}
	}

	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<div className='space-y-4'>
				<Link
					to='/'
					className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
					<ArrowLeftIcon size={14} />
					{t('common.back')}
				</Link>

				<div className='rounded-xl border p-5 md:p-6 space-y-3'>
					<div className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
						<InfoIcon size={28} />
						{t('settings.aboutTitle')}
					</div>
					<p className='text-sm text-muted-foreground'>
						{t('settings.aboutHint')}
					</p>
					<p className='text-xs font-mono text-muted-foreground'>
						{app.name} v{app.version}
					</p>
				</div>

				<div className='rounded-md border p-4 space-y-4'>
					<div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
						<div className='space-y-2'>
							<div className='text-lg font-semibold'>
								{t('settings.aboutTitle')}
							</div>
							<div className='text-sm text-muted-foreground'>
								{t('settings.aboutHint')}
							</div>
						</div>

						<Button
							variant='outline'
							onClick={() => void handleCheckForUpdates()}
							disabled={isCheckingForUpdates}>
							<RefreshCwIcon
								size={14}
								className={
									isCheckingForUpdates ? 'animate-spin' : undefined
								}
							/>
							{t('updates.checkButton')}
						</Button>
					</div>

					<div className='grid gap-3 md:grid-cols-2'>
						<div className='rounded-md border bg-background/60 p-3 space-y-1.5'>
							<div className='flex items-center gap-2 text-sm font-medium'>
								<PackageIcon size={15} />
								{t('settings.aboutVersion')}
							</div>
							<div className='font-mono text-sm'>{app.version}</div>
							<div className='text-xs text-muted-foreground'>
								{app.name}
							</div>
						</div>

						<div className='rounded-md border bg-background/60 p-3 space-y-1.5'>
							<div className='flex items-center gap-2 text-sm font-medium'>
								<CalendarDaysIcon size={15} />
								{t('settings.aboutReleaseDate')}
							</div>
							<div className='text-sm'>
								{formatReleaseDate(
									resolvedCurrentRelease?.publishedAt,
									language,
								)}
							</div>
							<div className='text-xs text-muted-foreground'>
								{resolvedCurrentRelease?.tagName ??
									t('settings.aboutReleaseDateUnknown')}
							</div>
						</div>

						<div className='rounded-md border bg-background/60 p-3 space-y-1.5'>
							<div className='flex items-center gap-2 text-sm font-medium'>
								<RocketIcon size={15} />
								{t('settings.aboutLatestRelease')}
							</div>
							<div className='font-mono text-sm'>
								{latestRelease?.tagName ?? '...'}
							</div>
							<div className='text-xs text-muted-foreground'>
								{latestRelease ?
									formatReleaseDate(latestRelease.publishedAt, language)
								:	t('settings.aboutLatestReleaseHint')}
							</div>
						</div>

						<div className='rounded-md border bg-background/60 p-3 space-y-1.5'>
							<div className='flex items-center gap-2 text-sm font-medium'>
								<BoxesIcon size={15} />
								{t('settings.aboutUpdateStatus')}
							</div>
							<div className='text-sm'>
								{hasUpdate && latestRelease ?
									t('updates.availableLabel', {
										version: latestRelease.version,
									})
								:	t('updates.noUpdateLabel')}
							</div>
							<div className='text-xs text-muted-foreground'>
								{checkedAt ?
									t('settings.aboutCheckedAt', {
										date: formatReleaseDate(checkedAt, language),
									})
								:	t('settings.aboutNotCheckedYet')}
							</div>
						</div>
					</div>

					{updateError && (
						<div className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
							{updateError}
						</div>
					)}

					<div className='flex flex-wrap gap-2'>
						<Button
							variant='outline'
							onClick={() => void handleOpenUrl(APP_REPOSITORY_URL)}>
							<ArrowUpRightIcon size={14} />
							{t('settings.aboutOpenRepository')}
						</Button>
						<Button
							variant='outline'
							onClick={() => void handleOpenUrl(APP_RELEASES_URL)}>
							<ArrowUpRightIcon size={14} />
							{t('settings.aboutOpenReleases')}
						</Button>
						{hasUpdate && latestRelease && (
							<Button
								onClick={() => void handleOpenUrl(latestRelease.htmlUrl)}>
								<ArrowUpRightIcon size={14} />
								{t('updates.downloadButton', {
									version: latestRelease.version,
								})}
							</Button>
						)}
					</div>
				</div>

				<div className='rounded-md border p-4 space-y-3'>
					<div className='font-medium'>{t('settings.aboutTechStack')}</div>
					<div className='text-xs text-muted-foreground'>
						{t('settings.aboutTechStackHint')}
					</div>
					<div className='flex flex-wrap gap-2'>
						{APP_TECH_STACK.map((item: string) => (
							<div
								key={item}
								className='rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground'>
								{item}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
