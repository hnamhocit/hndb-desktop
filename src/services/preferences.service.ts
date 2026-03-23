import type { Store } from '@tauri-apps/plugin-store'

export const APP_THEMES = ['light', 'dark'] as const
export const APP_LANGUAGES = ['en', 'vi'] as const
export const APP_FONT_FAMILIES = [
	'inter',
	'manrope',
	'dmSans',
	'geist',
	'system',
	'serif',
	'uploaded',
] as const
export const APP_MONO_FONT_FAMILIES = [
	'geistMono',
	'jetbrainsMono',
	'firaCode',
	'uiMono',
	'courier',
	'uploaded',
] as const

export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 72
export const FONT_SIZE_DEFAULT = 16
export const MAX_UPLOAD_FONT_BYTES = 3 * 1024 * 1024
const DEFAULT_SANS_FONT_FAMILY: Exclude<AppFontFamily, 'uploaded'> = 'geist'
const DEFAULT_MONO_FONT_FAMILY: Exclude<AppMonoFontFamily, 'uploaded'> =
	'geistMono'

export type AppTheme = (typeof APP_THEMES)[number]
export type AppLanguage = (typeof APP_LANGUAGES)[number]
export type AppFontFamily = (typeof APP_FONT_FAMILIES)[number]
export type AppMonoFontFamily = (typeof APP_MONO_FONT_FAMILIES)[number]

export interface UploadedFontPreference {
	fileName: string
	mimeType: string
	dataUrl: string
}

export interface AppPreferences {
	theme: AppTheme
	language: AppLanguage
	fontSize: number
	fontFamily: AppFontFamily
	monoFontFamily: AppMonoFontFamily
	uploadedFont: UploadedFontPreference | null
	uploadedMonoFont: UploadedFontPreference | null
}

export const DEFAULT_PREFERENCES: AppPreferences = {
	theme: 'light',
	language: 'en',
	fontSize: FONT_SIZE_DEFAULT,
	fontFamily: DEFAULT_SANS_FONT_FAMILY,
	monoFontFamily: DEFAULT_MONO_FONT_FAMILY,
	uploadedFont: null,
	uploadedMonoFont: null,
}

const STORE_PATH = 'preferences.json'
const LOCAL_STORAGE_KEY = 'hndb.preferences.v1'
const LEGACY_FONT_SIZE_MAP = {
	sm: '14px',
	md: '16px',
	lg: '18px',
} as const
const FONT_FAMILY_STACK: Record<Exclude<AppFontFamily, 'uploaded'>, string> = {
	inter: '\'Inter Variable\', Inter, ui-sans-serif, system-ui, sans-serif',
	manrope:
		'\'Manrope Variable\', Manrope, ui-sans-serif, system-ui, sans-serif',
	dmSans:
		'\'DM Sans Variable\', \'DM Sans\', ui-sans-serif, system-ui, sans-serif',
	geist: '\'Geist Variable\', ui-sans-serif, system-ui, sans-serif',
	system: 'system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif',
	serif: 'Iowan Old Style, Georgia, \'Times New Roman\', serif',
}
const MONO_FONT_FAMILY_STACK: Record<Exclude<AppMonoFontFamily, 'uploaded'>, string> = {
	geistMono:
		'\'Geist Mono Variable\', \'Geist Mono\', ui-monospace, \'SFMono-Regular\', Menlo, Consolas, monospace',
	jetbrainsMono:
		'\'JetBrains Mono Variable\', \'JetBrains Mono\', ui-monospace, \'SFMono-Regular\', Menlo, Consolas, monospace',
	firaCode:
		'\'Fira Code\', ui-monospace, \'SFMono-Regular\', Menlo, Consolas, monospace',
	uiMono: 'ui-monospace, \'SFMono-Regular\', Menlo, Consolas, monospace',
	courier: '\'Courier New\', Courier, monospace',
}
const THEME_TRANSITION_CLASS = 'theme-switching'
const THEME_TRANSITION_MS = 220
const MAX_UPLOAD_FONT_DATA_URL_LENGTH = 6_000_000

let tauriStorePromise: Promise<Store | null> | null = null
let themeTransitionTimeout: ReturnType<typeof setTimeout> | null = null
let uploadedSansFont: {
	signature: string
	family: string
	fontFace: FontFace
} | null = null
let uploadedMonoFont: {
	signature: string
	family: string
	fontFace: FontFace
} | null = null

const isAppTheme = (value: unknown): value is AppTheme =>
	typeof value === 'string' && APP_THEMES.includes(value as AppTheme)

const isAppLanguage = (value: unknown): value is AppLanguage =>
	typeof value === 'string' && APP_LANGUAGES.includes(value as AppLanguage)

const isAppFontFamily = (value: unknown): value is AppFontFamily =>
	typeof value === 'string' &&
	APP_FONT_FAMILIES.includes(value as AppFontFamily)

const isAppMonoFontFamily = (value: unknown): value is AppMonoFontFamily =>
	typeof value === 'string' &&
	APP_MONO_FONT_FAMILIES.includes(value as AppMonoFontFamily)

const normalizeFontFamily = (value: unknown): AppFontFamily | null => {
	if (value === 'humanist') return 'manrope'
	return isAppFontFamily(value) ? value : null
}

const normalizeMonoFontFamily = (value: unknown): AppMonoFontFamily | null => {
	return isAppMonoFontFamily(value) ? value : null
}

const clampFontSize = (value: number): number =>
	Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, Math.round(value)))

const sanitizeFontSize = (value: unknown): number => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return clampFontSize(value)
	}

	if (
		typeof value === 'string' &&
		Object.prototype.hasOwnProperty.call(LEGACY_FONT_SIZE_MAP, value)
	) {
		return Number.parseInt(
			LEGACY_FONT_SIZE_MAP[value as keyof typeof LEGACY_FONT_SIZE_MAP],
			10,
		)
	}

	if (typeof value === 'string') {
		const numeric = Number.parseFloat(value)
		if (Number.isFinite(numeric)) {
			return clampFontSize(numeric)
		}
	}

	return DEFAULT_PREFERENCES.fontSize
}

const sanitizeUploadedFont = (value: unknown): UploadedFontPreference | null => {
	if (!value || typeof value !== 'object') return null

	const input = value as Partial<UploadedFontPreference>
	if (
		typeof input.fileName !== 'string' ||
		typeof input.mimeType !== 'string' ||
		typeof input.dataUrl !== 'string'
	) {
		return null
	}

	const fileName = input.fileName.trim()
	const mimeType = input.mimeType.trim()
	const dataUrl = input.dataUrl.trim()

	if (!fileName || !mimeType || !dataUrl.startsWith('data:')) {
		return null
	}

	if (dataUrl.length > MAX_UPLOAD_FONT_DATA_URL_LENGTH) {
		return null
	}

	return { fileName, mimeType, dataUrl }
}

const sanitizePreferences = (
	input: Partial<AppPreferences>,
): AppPreferences => {
	const nextUploadedFont = sanitizeUploadedFont(input.uploadedFont)
	const nextUploadedMonoFont = sanitizeUploadedFont(input.uploadedMonoFont)
	const nextFontFamily =
		normalizeFontFamily(input.fontFamily) ?? DEFAULT_PREFERENCES.fontFamily
	const nextMonoFontFamily =
		normalizeMonoFontFamily(input.monoFontFamily) ??
		DEFAULT_PREFERENCES.monoFontFamily

	return {
		theme: isAppTheme(input.theme) ? input.theme : DEFAULT_PREFERENCES.theme,
		language:
			isAppLanguage(input.language) ?
				input.language
			:	DEFAULT_PREFERENCES.language,
		fontSize: sanitizeFontSize(input.fontSize),
		fontFamily:
			nextFontFamily === 'uploaded' && !nextUploadedFont ?
				DEFAULT_PREFERENCES.fontFamily
			:	nextFontFamily,
		monoFontFamily:
			nextMonoFontFamily === 'uploaded' && !nextUploadedMonoFont ?
				DEFAULT_PREFERENCES.monoFontFamily
			:	nextMonoFontFamily,
		uploadedFont: nextUploadedFont,
		uploadedMonoFont: nextUploadedMonoFont,
	}
}

export const normalizePreferencesInput = (
	input: Partial<AppPreferences>,
): AppPreferences => sanitizePreferences(input)

const getTauriStore = async (): Promise<Store | null> => {
	if (typeof window === 'undefined') return null

	if (!tauriStorePromise) {
		tauriStorePromise = (async () => {
			const { isTauri } = await import('@tauri-apps/api/core')
			if (!isTauri()) return null

			const { load } = await import('@tauri-apps/plugin-store')
			return load(STORE_PATH, {
				autoSave: 100,
				defaults: { ...DEFAULT_PREFERENCES } as Record<string, unknown>,
			})
		})()
	}

	return tauriStorePromise
}

const loadFromLocalStorage = (): AppPreferences => {
	if (typeof window === 'undefined') return DEFAULT_PREFERENCES
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
		if (!raw) return DEFAULT_PREFERENCES
		const parsed = JSON.parse(raw) as Partial<AppPreferences>
		return sanitizePreferences(parsed)
	} catch {
		return DEFAULT_PREFERENCES
	}
}

const saveToLocalStorage = (preferences: AppPreferences) => {
	if (typeof window === 'undefined') return
	try {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences))
	} catch (error) {
		console.warn('Failed to persist preferences in localStorage:', error)
	}
}

export const loadPreferences = async (): Promise<AppPreferences> => {
	const store = await getTauriStore()
	if (store) {
		const [
			theme,
			language,
			fontSize,
			fontFamily,
			monoFontFamily,
			uploadedFont,
			uploadedMonoFont,
		] = await Promise.all([
			store.get<AppTheme>('theme'),
			store.get<AppLanguage>('language'),
			store.get<number>('fontSize'),
			store.get<AppFontFamily>('fontFamily'),
			store.get<AppMonoFontFamily>('monoFontFamily'),
			store.get<UploadedFontPreference | null>('uploadedFont'),
			store.get<UploadedFontPreference | null>('uploadedMonoFont'),
		])
		return sanitizePreferences({
			theme,
			language,
			fontSize,
			fontFamily,
			monoFontFamily,
			uploadedFont,
			uploadedMonoFont,
		})
	}

	return loadFromLocalStorage()
}

export const savePreferences = async (
	preferences: AppPreferences,
): Promise<void> => {
	const store = await getTauriStore()
	if (store) {
		await Promise.all([
			store.set('theme', preferences.theme),
			store.set('language', preferences.language),
			store.set('fontSize', preferences.fontSize),
			store.set('fontFamily', preferences.fontFamily),
			store.set('monoFontFamily', preferences.monoFontFamily),
			store.set('uploadedFont', preferences.uploadedFont),
			store.set('uploadedMonoFont', preferences.uploadedMonoFont),
		])
		return
	}

	saveToLocalStorage(preferences)
}

const hashString = (input: string): string => {
	let hash = 2166136261
	for (let index = 0; index < input.length; index += 53) {
		hash ^= input.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}

	return (hash >>> 0).toString(36)
}

const makeUploadedSignature = (font: UploadedFontPreference): string =>
	[
		font.fileName,
		font.mimeType,
		font.dataUrl.length,
		font.dataUrl.slice(0, 48),
		font.dataUrl.slice(-48),
	].join('|')

const clearUploadedFontRegistration = (slot: 'sans' | 'mono') => {
	if (typeof document === 'undefined') return

	if (slot === 'sans') {
		if (uploadedSansFont) {
			document.fonts.delete(uploadedSansFont.fontFace)
		}
		uploadedSansFont = null
		return
	}

	if (uploadedMonoFont) {
		document.fonts.delete(uploadedMonoFont.fontFace)
	}
	uploadedMonoFont = null
}

const ensureUploadedFontRegistration = (
	slot: 'sans' | 'mono',
	font: UploadedFontPreference | null,
): string | null => {
	if (typeof document === 'undefined') return null

	if (!font) {
		clearUploadedFontRegistration(slot)
		return null
	}

	const signature = makeUploadedSignature(font)
	const current = slot === 'sans' ? uploadedSansFont : uploadedMonoFont
	if (current?.signature === signature) {
		return current.family
	}

	clearUploadedFontRegistration(slot)
	const family = `HNDBUploaded${slot === 'sans' ? 'Sans' : 'Mono'}-${hashString(signature)}`
	const fontFace = new FontFace(family, `url(${font.dataUrl})`)
	fontFace.display = 'swap'

	const nextRegistration = { signature, family, fontFace }
	if (slot === 'sans') {
		uploadedSansFont = nextRegistration
	} else {
		uploadedMonoFont = nextRegistration
	}

	void fontFace
		.load()
		.then((loadedFace) => {
			const active = slot === 'sans' ? uploadedSansFont : uploadedMonoFont
			if (active?.signature !== signature) return
			document.fonts.add(loadedFace)
		})
		.catch((error) => {
			console.warn(`Failed to load ${slot} uploaded font:`, error)
			const active = slot === 'sans' ? uploadedSansFont : uploadedMonoFont
			if (active?.signature === signature) {
				clearUploadedFontRegistration(slot)
			}
		})

	return family
}

const resolveSansFontFamily = (
	preferences: AppPreferences,
	uploadedFamily: string | null,
): string => {
	switch (preferences.fontFamily) {
		case 'uploaded':
			if (uploadedFamily) {
				return `"${uploadedFamily}", ${FONT_FAMILY_STACK[DEFAULT_SANS_FONT_FAMILY]}`
			}
			return FONT_FAMILY_STACK[DEFAULT_SANS_FONT_FAMILY]
		case 'inter':
		case 'manrope':
		case 'dmSans':
		case 'geist':
		case 'system':
		case 'serif':
			return FONT_FAMILY_STACK[preferences.fontFamily]
	}
}

const resolveMonoFontFamily = (
	preferences: AppPreferences,
	uploadedFamily: string | null,
): string => {
	switch (preferences.monoFontFamily) {
		case 'uploaded':
			if (uploadedFamily) {
				return `"${uploadedFamily}", ${MONO_FONT_FAMILY_STACK[DEFAULT_MONO_FONT_FAMILY]}`
			}
			return MONO_FONT_FAMILY_STACK[DEFAULT_MONO_FONT_FAMILY]
		case 'geistMono':
		case 'uiMono':
		case 'jetbrainsMono':
		case 'firaCode':
		case 'courier':
			return MONO_FONT_FAMILY_STACK[preferences.monoFontFamily]
	}
}

export const applyPreferencesToDom = (preferences: AppPreferences) => {
	if (typeof document === 'undefined') return

	const root = document.documentElement
	const previousTheme = root.dataset.theme as AppTheme | undefined

	if (previousTheme && previousTheme !== preferences.theme) {
		root.classList.add(THEME_TRANSITION_CLASS)
		if (themeTransitionTimeout) {
			clearTimeout(themeTransitionTimeout)
		}
		themeTransitionTimeout = setTimeout(() => {
			root.classList.remove(THEME_TRANSITION_CLASS)
			themeTransitionTimeout = null
		}, THEME_TRANSITION_MS)
	}

	root.classList.toggle('dark', preferences.theme === 'dark')
	root.dataset.theme = preferences.theme
	root.lang = preferences.language

	const normalizedPreferences = sanitizePreferences(preferences)
	const uploadedSansFamily = ensureUploadedFontRegistration(
		'sans',
		normalizedPreferences.uploadedFont,
	)
	const uploadedMonoFamily = ensureUploadedFontRegistration(
		'mono',
		normalizedPreferences.uploadedMonoFont,
	)

	root.style.setProperty('--app-font-size', `${normalizedPreferences.fontSize}px`)
	root.style.setProperty(
		'--app-font-family',
		resolveSansFontFamily(normalizedPreferences, uploadedSansFamily),
	)
	root.style.setProperty(
		'--app-mono-font-family',
		resolveMonoFontFamily(normalizedPreferences, uploadedMonoFamily),
	)
}
