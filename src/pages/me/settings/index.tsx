'use client'

import {
	ArrowLeftIcon,
	DownloadIcon,
	FlameIcon,
	MoonIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SunIcon,
	Trash2Icon,
	UploadIcon,
} from 'lucide-react'
import Editor, { type Monaco } from '@monaco-editor/react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	APP_FONT_FAMILIES,
	APP_LANGUAGES,
	APP_MONO_FONT_FAMILIES,
	APP_THEMES,
	FONT_SIZE_MAX,
	FONT_SIZE_MIN,
	MAX_UPLOAD_FONT_BYTES,
	type AppPreferences,
	type AppFontFamily,
	type AppMonoFontFamily,
	type UploadedFontPreference,
} from '@/services/preferences.service'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePreferencesStore, useUserStore } from '@/stores'

const SUPPORTED_FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'] as const
const FONT_INPUT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2'
const SETTINGS_JSON_MODEL_URI = 'inmemory://model/hndb-preferences.json'
const SETTINGS_JSON_SCHEMA_URI = 'inmemory://schema/hndb-preferences.schema.json'
const SETTINGS_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: [
		'theme',
		'language',
		'fontSize',
		'fontFamily',
		'monoFontFamily',
		'uploadedFont',
		'uploadedMonoFont',
	],
	properties: {
		theme: {
			type: 'string',
			enum: APP_THEMES,
		},
		language: {
			type: 'string',
			enum: APP_LANGUAGES,
		},
		fontSize: {
			type: 'integer',
			minimum: FONT_SIZE_MIN,
			maximum: FONT_SIZE_MAX,
		},
		fontFamily: {
			type: 'string',
			enum: APP_FONT_FAMILIES,
		},
		monoFontFamily: {
			type: 'string',
			enum: APP_MONO_FONT_FAMILIES,
		},
		uploadedFont: {
			anyOf: [
				{ type: 'null' },
				{
					type: 'object',
					additionalProperties: false,
					required: ['fileName', 'mimeType', 'dataUrl'],
					properties: {
						fileName: { type: 'string' },
						mimeType: { type: 'string' },
						dataUrl: { type: 'string' },
					},
				},
			],
		},
		uploadedMonoFont: {
			anyOf: [
				{ type: 'null' },
				{
					type: 'object',
					additionalProperties: false,
					required: ['fileName', 'mimeType', 'dataUrl'],
					properties: {
						fileName: { type: 'string' },
						mimeType: { type: 'string' },
						dataUrl: { type: 'string' },
					},
				},
			],
		},
	},
} as const

const getFileExtension = (fileName: string): string => {
	const lastDot = fileName.lastIndexOf('.')
	if (lastDot < 0) return ''
	return fileName.slice(lastDot + 1).toLowerCase()
}

const stripFileExtension = (fileName: string): string => {
	const lastDot = fileName.lastIndexOf('.')
	return lastDot > 0 ? fileName.slice(0, lastDot) : fileName
}

const isSupportedFontFile = (file: File): boolean => {
	const extension = getFileExtension(file.name)
	return SUPPORTED_FONT_EXTENSIONS.includes(
		extension as (typeof SUPPORTED_FONT_EXTENSIONS)[number],
	)
}

const readFileAsDataUrl = async (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result))
		reader.onerror = () => reject(new Error('Failed to read file as data URL'))
		reader.readAsDataURL(file)
	})

const configurePreferencesJsonSchema = (monaco: Monaco) => {
	monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
		validate: true,
		enableSchemaRequest: false,
		allowComments: true,
		schemas: [
			{
				uri: SETTINGS_JSON_SCHEMA_URI,
				fileMatch: [SETTINGS_JSON_MODEL_URI],
				schema: SETTINGS_JSON_SCHEMA,
			},
		],
	})
}

export default function MeSettingsPage() {
	type SettingsTabValue = 'profile' | 'preferences' | 'config'
	const { user } = useUserStore()
	const theme = usePreferencesStore((state) => state.theme)
	const toggleTheme = usePreferencesStore((state) => state.toggleTheme)
	const language = usePreferencesStore((state) => state.language)
	const setLanguage = usePreferencesStore((state) => state.setLanguage)
	const fontSize = usePreferencesStore((state) => state.fontSize)
	const setFontSize = usePreferencesStore((state) => state.setFontSize)
	const fontFamily = usePreferencesStore((state) => state.fontFamily)
	const setFontFamily = usePreferencesStore((state) => state.setFontFamily)
	const monoFontFamily = usePreferencesStore((state) => state.monoFontFamily)
	const setMonoFontFamily = usePreferencesStore((state) => state.setMonoFontFamily)
	const uploadedFont = usePreferencesStore((state) => state.uploadedFont)
	const setUploadedFont = usePreferencesStore((state) => state.setUploadedFont)
	const uploadedMonoFont = usePreferencesStore((state) => state.uploadedMonoFont)
	const setUploadedMonoFont = usePreferencesStore(
		(state) => state.setUploadedMonoFont,
	)
	const setPreferences = usePreferencesStore((state) => state.setPreferences)
	const { t } = useI18n()
	const uploadedNormalInputRef = useRef<HTMLInputElement | null>(null)
	const uploadedMonoInputRef = useRef<HTMLInputElement | null>(null)
	const [settingsForm, setSettingsForm] = useState({
		name: user?.name || '',
		email: user?.email || '',
	})
	const [deleteConfirm, setDeleteConfirm] = useState('')
	const [fontSizeInput, setFontSizeInput] = useState(String(fontSize))
	const [preferencesJsonError, setPreferencesJsonError] = useState<string | null>(
		null,
	)
	const isDarkMode = theme === 'dark'
	const maxUploadSizeMb = Math.round(MAX_UPLOAD_FONT_BYTES / (1024 * 1024))
	const currentPreferences = useMemo<AppPreferences>(
		() => ({
			theme,
			language,
			fontSize,
			fontFamily,
			monoFontFamily,
			uploadedFont,
			uploadedMonoFont,
		}),
		[
			theme,
			language,
			fontSize,
			fontFamily,
			monoFontFamily,
			uploadedFont,
			uploadedMonoFont,
		],
	)
	const currentPreferencesJson = useMemo(
		() => JSON.stringify(currentPreferences, null, 2),
		[currentPreferences],
	)
	const [preferencesJsonDraft, setPreferencesJsonDraft] = useState(
		currentPreferencesJson,
	)
	const [settingsTab, setSettingsTab] = useState<SettingsTabValue>('profile')

	useEffect(() => {
		setFontSizeInput(String(fontSize))
	}, [fontSize])

	useEffect(() => {
		setPreferencesJsonDraft(currentPreferencesJson)
		setPreferencesJsonError(null)
	}, [currentPreferencesJson])

	const normalFontOptions = useMemo(() => {
		const options: Array<{ value: AppFontFamily; label: string }> = [
			{ value: 'geist', label: t('settings.fontFamilyOption.geist') },
			{ value: 'inter', label: t('settings.fontFamilyOption.inter') },
			{ value: 'manrope', label: t('settings.fontFamilyOption.manrope') },
			{ value: 'dmSans', label: t('settings.fontFamilyOption.dmSans') },
			{ value: 'system', label: t('settings.fontFamilyOption.system') },
			{ value: 'serif', label: t('settings.fontFamilyOption.serif') },
		]
		if (uploadedFont) {
			options.push({
				value: 'uploaded',
				label: t('settings.fontFamilyOption.uploaded', {
					name: uploadedFont.fileName,
				}),
			})
		}
		return options
	}, [t, uploadedFont])

	const monoFontOptions = useMemo(() => {
		const options: Array<{ value: AppMonoFontFamily; label: string }> = [
			{ value: 'geistMono', label: t('settings.monoFontOption.geistMono') },
			{
				value: 'jetbrainsMono',
				label: t('settings.monoFontOption.jetbrainsMono'),
			},
			{ value: 'firaCode', label: t('settings.monoFontOption.firaCode') },
			{ value: 'uiMono', label: t('settings.monoFontOption.uiMono') },
			{ value: 'courier', label: t('settings.monoFontOption.courier') },
		]
		if (uploadedMonoFont) {
			options.push({
				value: 'uploaded',
				label: t('settings.monoFontOption.uploaded', {
					name: uploadedMonoFont.fileName,
				}),
			})
		}
		return options
	}, [t, uploadedMonoFont])

	const handleSaveSettings = () => {
		toast.info(t('settings.toastSavePending'))
	}

	const handleForgotPassword = () => {
		toast.info(t('settings.toastResetPending'))
	}

	const handleDeleteAccount = () => {
		toast.error(t('settings.toastDeletePending'))
	}

	const handleCommitFontSize = async (value: string) => {
		const numeric = Number.parseInt(value, 10)
		if (!Number.isFinite(numeric)) {
			setFontSizeInput(String(fontSize))
			toast.error(t('settings.fontSizeInvalid'))
			return
		}

		const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, numeric))
		setFontSizeInput(String(clamped))
		await setFontSize(clamped)
	}

	const convertFileToUploadedPreference = async (
		file: File,
	): Promise<UploadedFontPreference> => {
		const dataUrl = await readFileAsDataUrl(file)
		return {
			fileName: stripFileExtension(file.name),
			mimeType: file.type || `font/${getFileExtension(file.name) || 'ttf'}`,
			dataUrl,
		}
	}

	const validateFontFile = (file: File): boolean => {
		if (!isSupportedFontFile(file)) {
			toast.error(t('settings.fontUploadUnsupportedFormat'))
			return false
		}

		if (file.size > MAX_UPLOAD_FONT_BYTES) {
			toast.error(t('settings.fontUploadTooLarge', { max: maxUploadSizeMb }))
			return false
		}

		return true
	}

	const handleUploadFont = async (event: ChangeEvent<HTMLInputElement>) => {
		const [file] = event.target.files ?? []
		event.target.value = ''
		if (!file || !validateFontFile(file)) return

		try {
			const uploadedPreference = await convertFileToUploadedPreference(file)
			await setUploadedFont(uploadedPreference)
			toast.success(
				t('settings.fontUploadSuccess', {
					name: uploadedPreference.fileName,
				}),
			)
		} catch {
			toast.error(t('settings.fontUploadFailed'))
		}
	}

	const handleUploadMonoFont = async (event: ChangeEvent<HTMLInputElement>) => {
		const [file] = event.target.files ?? []
		event.target.value = ''
		if (!file || !validateFontFile(file)) return

		try {
			const uploadedPreference = await convertFileToUploadedPreference(file)
			await setUploadedMonoFont(uploadedPreference)
			toast.success(
				t('settings.monoFontUploadSuccess', {
					name: uploadedPreference.fileName,
				}),
			)
		} catch {
			toast.error(t('settings.fontUploadFailed'))
		}
	}

	const parsePreferencesJsonDraft = (): Partial<AppPreferences> | null => {
		try {
			const parsed: unknown = JSON.parse(preferencesJsonDraft)
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				setPreferencesJsonError(t('settings.configEditorInvalidRoot'))
				return null
			}
			setPreferencesJsonError(null)
			return parsed as Partial<AppPreferences>
		} catch (error) {
			const detail =
				error instanceof Error ? error.message : t('common.unknownError')
			setPreferencesJsonError(
				t('settings.configEditorInvalidJson', { detail }),
			)
			return null
		}
	}

	const handleFormatPreferencesJson = () => {
		const parsed = parsePreferencesJsonDraft()
		if (!parsed) return
		setPreferencesJsonDraft(JSON.stringify(parsed, null, 2))
		toast.success(t('settings.configEditorFormatted'))
	}

	const handleApplyPreferencesJson = async () => {
		const parsed = parsePreferencesJsonDraft()
		if (!parsed) return
		await setPreferences(parsed)
		toast.success(t('settings.configEditorApplied'))
	}

	const handleResetPreferencesJson = () => {
		setPreferencesJsonDraft(currentPreferencesJson)
		setPreferencesJsonError(null)
		toast.info(t('settings.configEditorReset'))
	}

	const handleDownloadPreferencesJson = () => {
		const timestamp = new Date().toISOString().replace(/:/g, '-')
		const fileName = `hndb-preferences-${timestamp}.json`
		const blob = new Blob([currentPreferencesJson], {
			type: 'application/json;charset=utf-8',
		})
		const objectUrl = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = objectUrl
		anchor.download = fileName
		document.body.appendChild(anchor)
		anchor.click()
		anchor.remove()
		URL.revokeObjectURL(objectUrl)
		toast.success(t('settings.configEditorDownloaded'))
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

				<Tabs
					value={settingsTab}
					onValueChange={(value) =>
						setSettingsTab(value as SettingsTabValue)
					}
					className='space-y-4'>
					<TabsList className='w-full sm:w-fit'>
						<TabsTrigger
							value='profile'
							className='flex-1 sm:flex-none'>
							{t('common.profile')}
						</TabsTrigger>
						<TabsTrigger
							value='preferences'
							className='flex-1 sm:flex-none'>
							{t('settings.preferences')}
						</TabsTrigger>
						<TabsTrigger
							value='config'
							className='flex-1 sm:flex-none'>
							{t('settings.configTab')}
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value='profile'
						className='space-y-4'>
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
					</TabsContent>

					<TabsContent
						value='preferences'
						className='space-y-4'>
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

							<div className='flex items-center justify-between p-3'>
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
						</div>

						<div className='rounded-md border p-4 space-y-4'>
							<div>
								<div className='flex items-center justify-between gap-3'>
									<div className='font-medium'>{t('settings.typography')}</div>
									<Button
										size='sm'
										variant='outline'
										onClick={() => setSettingsTab('config')}>
										{t('settings.openConfigEditor')}
									</Button>
								</div>
								<div className='text-xs text-muted-foreground mt-1'>
									{t('settings.typographyHint')}
								</div>
							</div>

							<div className='rounded-md border p-3 space-y-2'>
								<div className='text-sm font-medium'>
									{t('common.fontSize')}
								</div>
								<div className='text-xs text-muted-foreground'>
									{t('settings.fontSizeRange', {
										min: FONT_SIZE_MIN,
										max: FONT_SIZE_MAX,
									})}
								</div>
								<div className='flex items-center gap-2'>
									<Input
										type='number'
										min={FONT_SIZE_MIN}
										max={FONT_SIZE_MAX}
										step='1'
										value={fontSizeInput}
										onChange={(event) =>
											setFontSizeInput(event.target.value)
										}
										onBlur={() =>
											void handleCommitFontSize(fontSizeInput)
										}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												event.currentTarget.blur()
											}
										}}
										className='w-28'
									/>
									<div className='text-xs text-muted-foreground'>
										{t('settings.fontSizePreview', {
											size: fontSize,
										})}
									</div>
								</div>
							</div>

							<div className='rounded-md border p-3 space-y-3'>
								<div className='text-sm font-medium'>
									{t('settings.normalFont')}
								</div>
								<Select
									value={fontFamily}
									onValueChange={(value) =>
										void setFontFamily(value as AppFontFamily)
									}>
									<SelectTrigger className='w-full md:max-w-sm'>
										<SelectValue placeholder={t('settings.selectFont')} />
									</SelectTrigger>
									<SelectContent>
										{normalFontOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className='flex flex-wrap items-center gap-2'>
									<input
										ref={uploadedNormalInputRef}
										type='file'
										accept={FONT_INPUT_ACCEPT}
										className='hidden'
										onChange={(event) => void handleUploadFont(event)}
									/>
									<Button
										size='sm'
										variant='outline'
										onClick={() =>
											uploadedNormalInputRef.current?.click()
										}>
										<UploadIcon size={14} />
										{uploadedFont ?
											t('settings.replaceFontFile')
										:	t('settings.uploadFontFile')}
									</Button>
									{uploadedFont && (
										<Button
											size='sm'
											variant='outline'
											onClick={() => void setUploadedFont(null)}>
											<Trash2Icon size={14} />
											{t('settings.removeUploadedFont')}
										</Button>
									)}
								</div>
								<div className='text-xs text-muted-foreground'>
									{uploadedFont ?
										t('settings.uploadedFontActive', {
											name: uploadedFont.fileName,
										})
									:	t('settings.noUploadedFont')}
								</div>
							</div>

							<div className='rounded-md border p-3 space-y-3'>
								<div className='text-sm font-medium'>
									{t('settings.monoFont')}
								</div>
								<Select
									value={monoFontFamily}
									onValueChange={(value) =>
										void setMonoFontFamily(value as AppMonoFontFamily)
									}>
									<SelectTrigger className='w-full md:max-w-sm'>
										<SelectValue
											placeholder={t('settings.selectMonoFont')}
										/>
									</SelectTrigger>
									<SelectContent>
										{monoFontOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className='flex flex-wrap items-center gap-2'>
									<input
										ref={uploadedMonoInputRef}
										type='file'
										accept={FONT_INPUT_ACCEPT}
										className='hidden'
										onChange={(event) =>
											void handleUploadMonoFont(event)
										}
									/>
									<Button
										size='sm'
										variant='outline'
										onClick={() =>
											uploadedMonoInputRef.current?.click()
										}>
										<UploadIcon size={14} />
										{uploadedMonoFont ?
											t('settings.replaceMonoFontFile')
										:	t('settings.uploadMonoFontFile')}
									</Button>
									{uploadedMonoFont && (
										<Button
											size='sm'
											variant='outline'
											onClick={() => void setUploadedMonoFont(null)}>
											<Trash2Icon size={14} />
											{t('settings.removeUploadedMonoFont')}
										</Button>
									)}
								</div>
								<div className='text-xs text-muted-foreground'>
									{uploadedMonoFont ?
										t('settings.uploadedMonoFontActive', {
											name: uploadedMonoFont.fileName,
										})
									:	t('settings.noUploadedMonoFont')}
								</div>
							</div>

							<div className='text-xs text-muted-foreground'>
								{t('settings.uploadFontLimitNote', { max: maxUploadSizeMb })}
							</div>
						</div>
					</TabsContent>

					<TabsContent
						value='config'
						className='space-y-4'>
						<div className='rounded-md border p-4 space-y-3'>
							<div>
								<div className='font-medium'>
									{t('settings.configEditorTitle')}
								</div>
								<div className='text-xs text-muted-foreground mt-1'>
									{t('settings.configEditorHint')}
								</div>
							</div>

							<div className='flex flex-wrap items-center gap-2'>
								<Button
									size='sm'
									variant='outline'
									onClick={handleFormatPreferencesJson}>
									{t('settings.configEditorFormat')}
								</Button>
								<Button
									size='sm'
									onClick={() => void handleApplyPreferencesJson()}>
									{t('settings.configEditorApply')}
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={handleResetPreferencesJson}>
									{t('settings.configEditorResetAction')}
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={handleDownloadPreferencesJson}>
									<DownloadIcon size={14} />
									{t('settings.configEditorDownload')}
								</Button>
							</div>

							{preferencesJsonError && (
								<div className='text-xs text-destructive'>
									{preferencesJsonError}
								</div>
							)}

								<div className='rounded-md border overflow-hidden'>
									<Editor
										height='480px'
										path={SETTINGS_JSON_MODEL_URI}
										beforeMount={configurePreferencesJsonSchema}
										defaultLanguage='json'
										language='json'
										theme={isDarkMode ? 'vs-dark' : 'vs'}
										value={preferencesJsonDraft}
										onChange={(value) =>
											setPreferencesJsonDraft(value || '')
										}
										options={{
											automaticLayout: true,
											minimap: { enabled: false },
											fontSize: 13,
											tabSize: 2,
											insertSpaces: true,
											wordWrap: 'on',
											formatOnPaste: true,
											formatOnType: true,
											padding: { top: 12 },
										}}
									/>
								</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
