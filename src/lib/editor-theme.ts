import { type Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { githubLight, gruvboxDark, nord, okaidia, tokyoNight } from '@uiw/codemirror-themes-all'

export const APP_EDITOR_THEMES = [
	'githubLight',
	'oneDark',
	'tokyoNight',
	'gruvboxDark',
	'nord',
	'okaidia',
] as const

export type AppEditorTheme = (typeof APP_EDITOR_THEMES)[number]

export const DEFAULT_EDITOR_THEME: AppEditorTheme = 'oneDark'

export const APP_EDITOR_THEME_OPTIONS: Array<{
	value: AppEditorTheme
	labelKey:
		| 'settings.monacoThemeOption.githubLight'
		| 'settings.monacoThemeOption.oneDark'
		| 'settings.monacoThemeOption.tokyoNight'
		| 'settings.monacoThemeOption.gruvboxDark'
		| 'settings.monacoThemeOption.nord'
		| 'settings.monacoThemeOption.okaidia'
}> = [
	{
		value: 'githubLight',
		labelKey: 'settings.monacoThemeOption.githubLight',
	},
	{
		value: 'oneDark',
		labelKey: 'settings.monacoThemeOption.oneDark',
	},
	{
		value: 'tokyoNight',
		labelKey: 'settings.monacoThemeOption.tokyoNight',
	},
	{
		value: 'gruvboxDark',
		labelKey: 'settings.monacoThemeOption.gruvboxDark',
	},
	{
		value: 'nord',
		labelKey: 'settings.monacoThemeOption.nord',
	},
	{
		value: 'okaidia',
		labelKey: 'settings.monacoThemeOption.okaidia',
	},
]

const CODEMIRROR_THEME_BY_EDITOR_THEME: Record<AppEditorTheme, Extension> = {
	githubLight,
	oneDark,
	tokyoNight,
	gruvboxDark,
	nord,
	okaidia,
}

const LEGACY_EDITOR_THEME_MAP: Record<string, AppEditorTheme> = {
	'hndb-github-light': 'githubLight',
	'hndb-one-dark': 'oneDark',
	'hndb-tokyo-night': 'tokyoNight',
	'hndb-gruvbox-dark': 'gruvboxDark',
	'hndb-nord': 'nord',
	'hndb-catppuccin-mocha': 'okaidia',
}

export const isAppEditorTheme = (value: unknown): value is AppEditorTheme =>
	typeof value === 'string' &&
	APP_EDITOR_THEMES.includes(value as AppEditorTheme)

export const normalizeEditorTheme = (value: unknown): AppEditorTheme | null => {
	if (isAppEditorTheme(value)) {
		return value
	}

	if (typeof value === 'string' && value in LEGACY_EDITOR_THEME_MAP) {
		return LEGACY_EDITOR_THEME_MAP[value]
	}

	return null
}

export const getCodeMirrorTheme = (theme: AppEditorTheme): Extension =>
	CODEMIRROR_THEME_BY_EDITOR_THEME[theme]

export const getMonacoBuiltinTheme = (theme: AppEditorTheme) =>
	theme === 'githubLight' ? 'vs' : 'vs-dark'
