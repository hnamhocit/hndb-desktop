import { create } from 'zustand'

import {
	applyPreferencesToDom,
	DEFAULT_PREFERENCES,
	loadPreferences,
	savePreferences,
} from '@/services/preferences.service'
import type {
	AppFontSize,
	AppLanguage,
	AppPreferences,
	AppTheme,
} from '@/services/preferences.service'

interface PreferencesStore extends AppPreferences {
	hydrated: boolean
	initialize: () => Promise<void>
	setTheme: (theme: AppTheme) => Promise<void>
	toggleTheme: () => Promise<void>
	setLanguage: (language: AppLanguage) => Promise<void>
	toggleLanguage: () => Promise<void>
	setFontSize: (fontSize: AppFontSize) => Promise<void>
}

const pickPreferences = (state: PreferencesStore): AppPreferences => ({
	theme: state.theme,
	language: state.language,
	fontSize: state.fontSize,
})

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
	...DEFAULT_PREFERENCES,
	hydrated: false,

	initialize: async () => {
		if (get().hydrated) return

		const loaded = await loadPreferences()
		applyPreferencesToDom(loaded)
		set({ ...loaded, hydrated: true })
	},

	setTheme: async (theme) => {
		const next = { ...pickPreferences(get()), theme }
		applyPreferencesToDom(next)
		set({ theme })
		await savePreferences(next)
	},

	toggleTheme: async () => {
		const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
		await get().setTheme(nextTheme)
	},

	setLanguage: async (language) => {
		const next = { ...pickPreferences(get()), language }
		applyPreferencesToDom(next)
		set({ language })
		await savePreferences(next)
	},

	toggleLanguage: async () => {
		const nextLanguage = get().language === 'en' ? 'vi' : 'en'
		await get().setLanguage(nextLanguage)
	},

	setFontSize: async (fontSize) => {
		const next = { ...pickPreferences(get()), fontSize }
		applyPreferencesToDom(next)
		set({ fontSize })
		await savePreferences(next)
	},
}))
