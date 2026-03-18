import type { Store } from '@tauri-apps/plugin-store'

export const APP_THEMES = ['light', 'dark'] as const
export const APP_LANGUAGES = ['en', 'vi'] as const
export const APP_FONT_SIZES = ['sm', 'md', 'lg'] as const

export type AppTheme = (typeof APP_THEMES)[number]
export type AppLanguage = (typeof APP_LANGUAGES)[number]
export type AppFontSize = (typeof APP_FONT_SIZES)[number]

export interface AppPreferences {
	theme: AppTheme
	language: AppLanguage
	fontSize: AppFontSize
}

export const DEFAULT_PREFERENCES: AppPreferences = {
	theme: 'light',
	language: 'en',
	fontSize: 'md',
}

const STORE_PATH = 'preferences.json'
const LOCAL_STORAGE_KEY = 'hndb.preferences.v1'
const FONT_SIZE_MAP: Record<AppFontSize, string> = {
	sm: '14px',
	md: '16px',
	lg: '18px',
}
const THEME_TRANSITION_CLASS = 'theme-switching'
const THEME_TRANSITION_MS = 220

let tauriStorePromise: Promise<Store | null> | null = null
let themeTransitionTimeout: ReturnType<typeof window.setTimeout> | null = null

const isAppTheme = (value: unknown): value is AppTheme =>
	typeof value === 'string' && APP_THEMES.includes(value as AppTheme)

const isAppLanguage = (value: unknown): value is AppLanguage =>
	typeof value === 'string' && APP_LANGUAGES.includes(value as AppLanguage)

const isAppFontSize = (value: unknown): value is AppFontSize =>
	typeof value === 'string' && APP_FONT_SIZES.includes(value as AppFontSize)

const sanitizePreferences = (
	input: Partial<AppPreferences>,
): AppPreferences => ({
	theme: isAppTheme(input.theme) ? input.theme : DEFAULT_PREFERENCES.theme,
	language:
		isAppLanguage(input.language) ?
			input.language
		:	DEFAULT_PREFERENCES.language,
	fontSize:
		isAppFontSize(input.fontSize) ?
			input.fontSize
		:	DEFAULT_PREFERENCES.fontSize,
})

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
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences))
}

export const loadPreferences = async (): Promise<AppPreferences> => {
	const store = await getTauriStore()
	if (store) {
		const [theme, language, fontSize] = await Promise.all([
			store.get<AppTheme>('theme'),
			store.get<AppLanguage>('language'),
			store.get<AppFontSize>('fontSize'),
		])
		return sanitizePreferences({ theme, language, fontSize })
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
		])
		return
	}

	saveToLocalStorage(preferences)
}

export const applyPreferencesToDom = (preferences: AppPreferences) => {
	if (typeof document === 'undefined') return

	const root = document.documentElement
	const previousTheme = root.dataset.theme as AppTheme | undefined

	if (previousTheme && previousTheme !== preferences.theme) {
		root.classList.add(THEME_TRANSITION_CLASS)
		if (themeTransitionTimeout) {
			window.clearTimeout(themeTransitionTimeout)
		}
		themeTransitionTimeout = window.setTimeout(() => {
			root.classList.remove(THEME_TRANSITION_CLASS)
			themeTransitionTimeout = null
		}, THEME_TRANSITION_MS)
	}

	root.classList.toggle('dark', preferences.theme === 'dark')
	root.dataset.theme = preferences.theme
	root.lang = preferences.language
	root.style.setProperty('--app-font-size', FONT_SIZE_MAP[preferences.fontSize])
}
