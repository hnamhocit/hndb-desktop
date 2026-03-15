'use client'

import {
	ArrowLeftIcon,
	FlameIcon,
	MoonIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SunIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AppFontSize } from '@/services/preferences.service'
import { usePreferencesStore, useUserStore } from '@/stores'

export default function MeSettingsPage() {
	const { user } = useUserStore()
	const theme = usePreferencesStore((state) => state.theme)
	const toggleTheme = usePreferencesStore((state) => state.toggleTheme)
	const language = usePreferencesStore((state) => state.language)
	const setLanguage = usePreferencesStore((state) => state.setLanguage)
	const fontSize = usePreferencesStore((state) => state.fontSize)
	const setFontSize = usePreferencesStore((state) => state.setFontSize)
	const { t } = useI18n()
	const fontSizeOptions: Array<{ value: AppFontSize; label: string }> = [
		{ value: 'sm', label: t('common.small') },
		{ value: 'md', label: t('common.medium') },
		{ value: 'lg', label: t('common.large') },
	]
	const [settingsForm, setSettingsForm] = useState({
		name: user?.name || '',
		email: user?.email || '',
	})
	const [deleteConfirm, setDeleteConfirm] = useState('')
	const isDarkMode = theme === 'dark'

	const handleSaveSettings = () => {
		toast.info('UI only: Save settings API will be connected later.')
	}

	const handleForgotPassword = () => {
		toast.info('UI only: Reset password flow will be connected later.')
	}

	const handleDeleteAccount = () => {
		toast.error('UI only: Delete account flow will be connected later.')
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

				<div className='rounded-xl border p-5 md:p-6'>
					<h1 className='text-3xl font-bold tracking-tight'>
						{t('settings.title')}
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						{t('settings.subtitle')}
					</p>
				</div>

				<div className='space-y-4'>
					<div className='rounded-md border p-4 space-y-3'>
						<div className='font-medium'>{t('settings.account')}</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
							<div className='space-y-1.5'>
								<div className='text-xs text-muted-foreground'>
									{t('settings.displayName')}
								</div>
								<Input
									value={settingsForm.name}
									onChange={(e) =>
										setSettingsForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder={t('settings.displayNamePlaceholder')}
								/>
							</div>
							<div className='space-y-1.5'>
								<div className='text-xs text-muted-foreground'>
									{t('common.email')}
								</div>
								<Input
									value={settingsForm.email}
									onChange={(e) =>
										setSettingsForm((prev) => ({
											...prev,
											email: e.target.value,
										}))
									}
									placeholder={t('settings.emailPlaceholder')}
								/>
							</div>
						</div>
						<Button
							size='sm'
							onClick={handleSaveSettings}>
							{t('settings.saveAccountChanges')}
						</Button>
					</div>

					<div className='rounded-md border p-4 space-y-3'>
						<div className='font-medium'>{t('settings.preferences')}</div>

						<div className='flex items-center justify-between p-3 border-b'>
							<div>
								<div className='text-sm font-medium'>
									{t('common.theme')}
								</div>
								<div className='text-xs text-muted-foreground'>
									{t('settings.toggleAppearance')}
								</div>
							</div>

							<Button
								size='sm'
								variant='outline'
								onClick={() => void toggleTheme()}>
								{isDarkMode ?
									<>
										<MoonIcon />
										{t('common.dark')}
									</>
								:	<>
										<SunIcon />
										{t('common.light')}
									</>
								}
							</Button>
						</div>

						<div className='flex items-center justify-between p-3 border-b'>
							<div>
								<div className='text-sm font-medium'>
									{t('common.language')}
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Button
									size='sm'
									variant={
										language === 'en' ? 'default' : 'outline'
									}
									onClick={() => void setLanguage('en')}>
									{t('common.english')}
								</Button>
								<Button
									size='sm'
									variant={
										language === 'vi' ? 'default' : 'outline'
									}
									onClick={() => void setLanguage('vi')}>
									{t('common.vietnamese')}
								</Button>
							</div>
						</div>

						<div className='flex items-center justify-between p-3 border-b'>
							<div>
								<div className='text-sm font-medium'>
									{t('common.fontSize')}
								</div>
							</div>

							<div className='flex items-center gap-2'>
								{fontSizeOptions.map((option) => (
									<Button
										key={option.value}
										size='sm'
										variant={
											fontSize === option.value ?
												'default'
											:	'outline'
										}
										onClick={() =>
											void setFontSize(option.value)
										}>
										{option.label}
									</Button>
								))}
							</div>
						</div>
					</div>

					<div className='rounded-md border p-4 space-y-3'>
						<div className='font-medium'>{t('settings.security')}</div>

						<div className='flex items-center justify-between p-3 border-t'>
							<div className='flex items-start gap-2'>
								<ShieldCheckIcon
									size={16}
									className='mt-0.5 text-muted-foreground'
								/>
								<div>
									<div className='text-sm font-medium'>
										{t('settings.forgotPassword')}
									</div>
									<div className='text-xs text-muted-foreground'>
										{t('settings.sendResetLinkHint')}
									</div>
								</div>
							</div>
							<Button
								size='sm'
								variant='outline'
								onClick={handleForgotPassword}>
								{t('settings.sendResetLink')}
							</Button>
						</div>
					</div>

					<div className='rounded-md border border-destructive/30 p-4 space-y-3'>
						<div className='font-medium text-destructive flex items-center gap-2'>
							<ShieldAlertIcon size={16} />
							{t('settings.dangerZone')}
						</div>
						<div className='text-xs text-muted-foreground'>
							{t('settings.deleteHint')}
						</div>
						<Input
							value={deleteConfirm}
							onChange={(e) => setDeleteConfirm(e.target.value)}
							placeholder={t('settings.typeDelete')}
						/>
						<Button
							variant='destructive'
							disabled={deleteConfirm !== 'DELETE'}
							onClick={handleDeleteAccount}>
							<FlameIcon />
							{t('settings.deleteAccount')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
