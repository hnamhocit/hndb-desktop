import { create } from 'zustand'

import { DEFAULT_KEYBINDINGS, type ShortcutActionId } from '@/lib/keybindings'
import {
	applyPreferencesToDom,
	DEFAULT_PREFERENCES,
	loadPreferences,
	normalizePreferencesInput,
	savePreferences,
} from '@/services/preferences.service'
import type {
	AppFontFamily,
	AppLanguage,
	AppMonacoTheme,
	AppMonoFontFamily,
	AppPreferences,
	AppTheme,
	UploadedFontPreference,
} from '@/services/preferences.service'

interface PreferencesStore extends AppPreferences {
	hydrated: boolean
	initialize: () => Promise<void>
	setTheme: (theme: AppTheme) => Promise<void>
	toggleTheme: () => Promise<void>
	setLanguage: (language: AppLanguage) => Promise<void>
	toggleLanguage: () => Promise<void>
	setFontSize: (fontSize: number) => Promise<void>
	setMonacoTheme: (monacoTheme: AppMonacoTheme) => Promise<void>
	setKeybinding: (
		actionId: ShortcutActionId,
		shortcut: string,
	) => Promise<void>
	resetKeybindings: () => Promise<void>
	setFontFamily: (fontFamily: AppFontFamily) => Promise<void>
	setMonoFontFamily: (monoFontFamily: AppMonoFontFamily) => Promise<void>
	setUploadedFont: (uploadedFont: UploadedFontPreference | null) => Promise<void>
	setUploadedMonoFont: (
		uploadedMonoFont: UploadedFontPreference | null,
	) => Promise<void>
	setPreferences: (input: Partial<AppPreferences>) => Promise<void>
}

const pickPreferences = (state: PreferencesStore): AppPreferences => ({
	theme: state.theme,
	language: state.language,
	fontSize: state.fontSize,
	monacoTheme: state.monacoTheme,
	keybindings: state.keybindings,
	fontFamily: state.fontFamily,
	monoFontFamily: state.monoFontFamily,
	uploadedFont: state.uploadedFont,
	uploadedMonoFont: state.uploadedMonoFont,
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

	setMonacoTheme: async (monacoTheme) => {
		const next = { ...pickPreferences(get()), monacoTheme }
		applyPreferencesToDom(next)
		set({ monacoTheme })
		await savePreferences(next)
	},

	setKeybinding: async (actionId, shortcut) => {
		const next = {
			...pickPreferences(get()),
			keybindings: {
				...get().keybindings,
				[actionId]: shortcut,
			},
		}
		applyPreferencesToDom(next)
		set({ keybindings: next.keybindings })
		await savePreferences(next)
	},

	resetKeybindings: async () => {
		const next = {
			...pickPreferences(get()),
			keybindings: { ...DEFAULT_KEYBINDINGS },
		}
		applyPreferencesToDom(next)
		set({ keybindings: next.keybindings })
		await savePreferences(next)
	},

	setFontFamily: async (fontFamily) => {
		const next = { ...pickPreferences(get()), fontFamily }
		applyPreferencesToDom(next)
		set({ fontFamily })
		await savePreferences(next)
	},

	setMonoFontFamily: async (monoFontFamily) => {
		const next = { ...pickPreferences(get()), monoFontFamily }
		applyPreferencesToDom(next)
		set({ monoFontFamily })
		await savePreferences(next)
	},

	setUploadedFont: async (uploadedFont) => {
		const state = get()
		const nextFontFamily =
			uploadedFont ? 'uploaded'
			: state.fontFamily === 'uploaded' ? DEFAULT_PREFERENCES.fontFamily
			:	state.fontFamily
		const next = {
			...pickPreferences(state),
			fontFamily: nextFontFamily,
			uploadedFont,
		}
		applyPreferencesToDom(next)
		set({
			fontFamily: nextFontFamily,
			uploadedFont,
		})
		await savePreferences(next)
	},

	setUploadedMonoFont: async (uploadedMonoFont) => {
		const state = get()
		const nextMonoFontFamily =
			uploadedMonoFont ? 'uploaded'
			: state.monoFontFamily === 'uploaded' ?
				DEFAULT_PREFERENCES.monoFontFamily
			:	state.monoFontFamily
		const next = {
			...pickPreferences(state),
			monoFontFamily: nextMonoFontFamily,
			uploadedMonoFont,
		}
		applyPreferencesToDom(next)
		set({
			monoFontFamily: nextMonoFontFamily,
			uploadedMonoFont,
		})
		await savePreferences(next)
	},

	setPreferences: async (input) => {
		const next = normalizePreferencesInput({
			...pickPreferences(get()),
			...input,
		})
		applyPreferencesToDom(next)
		set(next)
		await savePreferences(next)
	},
}))
