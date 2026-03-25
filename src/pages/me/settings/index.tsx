'use client'

import { PostgreSQL, sql } from '@codemirror/lang-sql'
import {
	ArrowLeftIcon,
	CommandIcon,
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
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	APP_SHORTCUT_ACTIONS,
	DEFAULT_KEYBINDINGS,
	formatShortcutForDisplay,
	isModifierOnlyKey,
	keyboardEventToShortcut,
	type ShortcutActionId,
} from '@/lib/keybindings'
import {
	APP_EDITOR_THEMES,
	APP_EDITOR_THEME_OPTIONS,
	getCodeMirrorTheme,
	getMonacoBuiltinTheme,
	type AppEditorTheme,
} from '@/lib/editor-theme'
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
import { useAppStore, usePreferencesStore, useUserStore } from '@/stores'

const SUPPORTED_FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'] as const
const FONT_INPUT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2'
const SETTINGS_JSON_MODEL_URI = 'inmemory://model/hndb-preferences.json'
const SETTINGS_JSON_SCHEMA_URI = 'inmemory://schema/hndb-preferences.schema.json'
const SQL_THEME_PREVIEW = `SELECT
  d.department_name,
  COUNT(*) AS total_employees,
  AVG(e.birth_year) AS avg_birth_year
FROM employees e
JOIN departments d
  ON d.id = e.dept_id
WHERE e.email IS NOT NULL
GROUP BY d.department_name
ORDER BY total_employees DESC;`
const SETTINGS_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: [
		'theme',
		'language',
		'fontSize',
		'editorTheme',
		'keybindings',
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
		editorTheme: {
			type: 'string',
			enum: APP_EDITOR_THEMES,
		},
		monacoTheme: {
			type: 'string',
		},
		keybindings: {
			type: 'object',
			additionalProperties: false,
			required: APP_SHORTCUT_ACTIONS,
			properties: {
				runQuery: { type: 'string' },
				newQuery: { type: 'string' },
				quickSearch: { type: 'string' },
				openSettingsJson: { type: 'string' },
				previousTab: { type: 'string' },
				nextTab: { type: 'string' },
			},
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
	type SettingsTabValue = 'profile' | 'preferences' | 'shortcuts' | 'config'
	const [searchParams, setSearchParams] = useSearchParams()
	const { user } = useUserStore()
	const app = useAppStore((state) => state.app)
	const initializeApp = useAppStore((state) => state.initialize)
	const theme = usePreferencesStore((state) => state.theme)
	const toggleTheme = usePreferencesStore((state) => state.toggleTheme)
	const setLanguage = usePreferencesStore((state) => state.setLanguage)
	const fontSize = usePreferencesStore((state) => state.fontSize)
	const setFontSize = usePreferencesStore((state) => state.setFontSize)
	const editorTheme = usePreferencesStore((state) => state.editorTheme)
	const setEditorTheme = usePreferencesStore((state) => state.setEditorTheme)
	const keybindings = usePreferencesStore((state) => state.keybindings)
	const setKeybinding = usePreferencesStore((state) => state.setKeybinding)
	const resetKeybindings = usePreferencesStore((state) => state.resetKeybindings)
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
	const { t, language } = useI18n()
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
	const [capturingShortcutAction, setCapturingShortcutAction] =
		useState<ShortcutActionId | null>(null)
	const isDarkMode = theme === 'dark'
	const maxUploadSizeMb = Math.round(MAX_UPLOAD_FONT_BYTES / (1024 * 1024))
	const currentPreferences = useMemo<AppPreferences>(
		() => ({
			theme,
			language,
			fontSize,
			editorTheme,
			keybindings,
			fontFamily,
			monoFontFamily,
			uploadedFont,
			uploadedMonoFont,
		}),
		[
			theme,
			language,
			fontSize,
			editorTheme,
			keybindings,
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
		const requestedTab = searchParams.get('tab')
		if (
			requestedTab === 'profile' ||
			requestedTab === 'preferences' ||
			requestedTab === 'shortcuts' ||
			requestedTab === 'config'
		) {
			setSettingsTab(requestedTab)
		}
	}, [searchParams])

	useEffect(() => {
		void initializeApp()
	}, [initializeApp])

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

	const editorThemeOptions = useMemo(
		() =>
			APP_EDITOR_THEME_OPTIONS.map((option) => ({
				value: option.value,
				label: t(option.labelKey),
			})) as Array<{ value: AppEditorTheme; label: string }>,
		[t],
	)

	const shortcutActionOptions = useMemo(
		() =>
			[
				{
					id: 'runQuery' as ShortcutActionId,
					label: t('settings.shortcuts.runQuery'),
					description: t('settings.shortcuts.runQueryDescription'),
				},
				{
					id: 'newQuery' as ShortcutActionId,
					label: t('settings.shortcuts.newQuery'),
					description: t('settings.shortcuts.newQueryDescription'),
				},
				{
					id: 'quickSearch' as ShortcutActionId,
					label: t('settings.shortcuts.quickSearch'),
					description: t('settings.shortcuts.quickSearchDescription'),
				},
				{
					id: 'openSettingsJson' as ShortcutActionId,
					label: t('settings.shortcuts.openSettingsJson'),
					description: t(
						'settings.shortcuts.openSettingsJsonDescription',
					),
				},
				{
					id: 'previousTab' as ShortcutActionId,
					label: t('settings.shortcuts.previousTab'),
					description: t('settings.shortcuts.previousTabDescription'),
				},
				{
					id: 'nextTab' as ShortcutActionId,
					label: t('settings.shortcuts.nextTab'),
					description: t('settings.shortcuts.nextTabDescription'),
				},
			],
		[t],
	)

	useEffect(() => {
		if (!capturingShortcutAction) return

		const handleShortcutCapture = (event: KeyboardEvent) => {
			if (event.isComposing) return

			if (event.key === 'Escape') {
				event.preventDefault()
				event.stopPropagation()
				setCapturingShortcutAction(null)
				return
			}

			if (isModifierOnlyKey(event.key)) {
				event.preventDefault()
				event.stopPropagation()
				return
			}

			const nextShortcut = keyboardEventToShortcut(event)
			if (!nextShortcut) return

			event.preventDefault()
			event.stopPropagation()

			const conflictingAction = shortcutActionOptions.find(
				(option) =>
					option.id !== capturingShortcutAction &&
					keybindings[option.id] === nextShortcut,
			)

			if (conflictingAction) {
				toast.error(
					t('settings.shortcuts.conflict', {
						action: conflictingAction.label,
					}),
				)
				setCapturingShortcutAction(null)
				return
			}

			void setKeybinding(capturingShortcutAction, nextShortcut)
			toast.success(
				t('settings.shortcuts.updated', {
					shortcut: formatShortcutForDisplay(nextShortcut),
				}),
			)
			setCapturingShortcutAction(null)
		}

		window.addEventListener('keydown', handleShortcutCapture, true)
		return () =>
			window.removeEventListener('keydown', handleShortcutCapture, true)
	}, [
		capturingShortcutAction,
		keybindings,
		setKeybinding,
		shortcutActionOptions,
		t,
	])

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
					<p className='mt-3 text-xs font-mono text-muted-foreground'>
						{app.name} v{app.version}
					</p>
				</div>

				<Tabs
					value={settingsTab}
					onValueChange={(value) => {
						const nextTab = value as SettingsTabValue
						setSettingsTab(nextTab)

						const nextSearchParams = new URLSearchParams(searchParams)
						nextSearchParams.set('tab', nextTab)
						setSearchParams(nextSearchParams, {
							replace: true,
						})
					}}
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
							value='shortcuts'
							className='flex-1 sm:flex-none'>
							{t('settings.shortcuts.tab')}
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
									{t('settings.monacoTheme')}
								</div>
								<div className='text-xs text-muted-foreground'>
									{t('settings.monacoThemeHint')}
								</div>
								<Select
									value={editorTheme}
									onValueChange={(value) =>
										void setEditorTheme(value as AppEditorTheme)
									}>
									<SelectTrigger className='w-full md:max-w-sm'>
										<SelectValue
											placeholder={t('settings.selectMonacoTheme')}
										/>
									</SelectTrigger>
									<SelectContent>
										{editorThemeOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<div className='overflow-hidden rounded-md border'>
									<CodeMirror
										height='220px'
										theme={getCodeMirrorTheme(editorTheme)}
										value={SQL_THEME_PREVIEW}
										editable={false}
										basicSetup={{
											foldGutter: false,
											dropCursor: false,
											allowMultipleSelections: false,
											lineNumbers: true,
										}}
										extensions={[
											sql({
												dialect: PostgreSQL,
												upperCaseKeywords: true,
											}),
										]}
										className='text-sm'
										style={{
											fontSize,
											fontFamily: 'var(--app-mono-font-family)',
										}}
									/>
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
						value='shortcuts'
						className='space-y-4'>
						<div className='space-y-4'>
							<div className='rounded-xl border bg-card/70 p-4 sm:p-5'>
								<div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
									<div className='space-y-2'>
										<div className='flex items-center gap-2 text-sm font-semibold'>
											<CommandIcon size={16} />
											{t('settings.shortcuts.title')}
										</div>
										<div className='max-w-2xl text-sm text-muted-foreground'>
											{t('settings.shortcuts.hint')}
										</div>
										<div className='flex flex-wrap items-center gap-2 pt-1'>
											<div className='rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground'>
												{shortcutActionOptions.length} actions
											</div>
											{capturingShortcutAction && (
												<div className='rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary'>
													{t('settings.shortcuts.listening')}
												</div>
											)}
										</div>
									</div>

									<Button
										size='sm'
										variant='outline'
										onClick={() => {
											setCapturingShortcutAction(null)
											void resetKeybindings()
										}}>
										{t('settings.shortcuts.resetAll')}
									</Button>
								</div>
							</div>

							<div className='grid gap-3'>
								{shortcutActionOptions.map((shortcutAction) => {
									const isCapturing =
										capturingShortcutAction === shortcutAction.id
									const currentShortcut = keybindings[shortcutAction.id]

									return (
										<div
											key={shortcutAction.id}
											className={`rounded-xl border p-4 transition-colors ${
												isCapturing ?
													'border-primary/40 bg-primary/5 shadow-sm'
												:	'bg-card/60'
											}`}>
											<div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
												<div className='space-y-1.5'>
													<div className='text-sm font-semibold'>
														{shortcutAction.label}
													</div>
													<div className='text-xs leading-6 text-muted-foreground'>
														{shortcutAction.description}
													</div>
												</div>

												<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
													<div className='min-w-[140px] rounded-lg border bg-background px-3 py-2 text-center font-mono text-xs shadow-xs'>
														{formatShortcutForDisplay(
															currentShortcut,
														)}
													</div>

													<div className='flex items-center gap-2'>
														<Button
															size='sm'
															variant={
																isCapturing ?
																	'default'
																:	'outline'
															}
															onClick={() =>
																setCapturingShortcutAction(
																	isCapturing ? null : shortcutAction.id,
																)
															}>
															{isCapturing ?
																t(
																	'settings.shortcuts.listening',
																)
															:	t('settings.shortcuts.change')}
														</Button>
														<Button
															size='sm'
															variant='ghost'
															onClick={() =>
																void setKeybinding(
																	shortcutAction.id,
																	DEFAULT_KEYBINDINGS[
																		shortcutAction.id
																	],
																)
															}>
															{t('settings.shortcuts.reset')}
														</Button>
													</div>
												</div>
											</div>

											{isCapturing && (
												<div className='mt-3 rounded-lg border border-primary/20 bg-background/80 px-3 py-2 text-xs text-muted-foreground'>
													{t('settings.shortcuts.listeningHint')}
												</div>
											)}
										</div>
									)
								})}
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
										theme={getMonacoBuiltinTheme(editorTheme)}
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
