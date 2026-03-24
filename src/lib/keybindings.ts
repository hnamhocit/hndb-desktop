export const APP_SHORTCUT_ACTIONS = [
	'runQuery',
	'newQuery',
	'quickSearch',
	'openSettingsJson',
	'previousTab',
	'nextTab',
] as const

export type ShortcutActionId = (typeof APP_SHORTCUT_ACTIONS)[number]

export type AppKeybindings = Record<ShortcutActionId, string>

export const DEFAULT_KEYBINDINGS: AppKeybindings = {
	runQuery: 'Mod+Enter',
	newQuery: 'Mod+T',
	quickSearch: 'Mod+K',
	openSettingsJson: 'Mod+,',
	previousTab: 'Alt+[',
	nextTab: 'Alt+]',
}

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Meta', 'Alt'])

const SPECIAL_KEY_LABELS: Record<string, string> = {
	' ': 'Space',
	Enter: 'Enter',
	Escape: 'Esc',
	Tab: 'Tab',
	Backspace: 'Backspace',
	Delete: 'Delete',
	ArrowUp: 'Up',
	ArrowDown: 'Down',
	ArrowLeft: 'Left',
	ArrowRight: 'Right',
}

export const isShortcutActionId = (
	value: string,
): value is ShortcutActionId => {
	return APP_SHORTCUT_ACTIONS.includes(value as ShortcutActionId)
}

export const isModifierOnlyKey = (key: string) => MODIFIER_KEYS.has(key)

const normalizeShortcutKey = (key: string) => {
	if (SPECIAL_KEY_LABELS[key]) {
		return SPECIAL_KEY_LABELS[key]
	}

	if (key.length === 1) {
		return key.toUpperCase()
	}

	return key
}

const normalizeStoredShortcut = (shortcut: string) =>
	shortcut
		.split('+')
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			if (part === 'Ctrl' || part === 'Cmd') return 'Mod'
			return part
		})
		.join('+')

export const keyboardEventToShortcut = (
	event: KeyboardEvent,
): string | null => {
	if (isModifierOnlyKey(event.key)) {
		return null
	}

	const parts: string[] = []

	if (event.ctrlKey || event.metaKey) {
		parts.push('Mod')
	}

	if (event.altKey) {
		parts.push('Alt')
	}

	if (event.shiftKey) {
		parts.push('Shift')
	}

	parts.push(normalizeShortcutKey(event.key))
	return parts.join('+')
}

export const matchesShortcut = (event: KeyboardEvent, shortcut: string) => {
	const nextShortcut = keyboardEventToShortcut(event)
	if (!nextShortcut) return false

	return (
		normalizeStoredShortcut(nextShortcut) ===
		normalizeStoredShortcut(shortcut)
	)
}

const isMacPlatform = () =>
	typeof navigator !== 'undefined' &&
	/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)

export const formatShortcutForDisplay = (shortcut: string) =>
	shortcut
		.split('+')
		.map((part) => {
			if (part === 'Mod') {
				return isMacPlatform() ? 'Cmd' : 'Ctrl'
			}

			if (/^[A-Z]$/.test(part)) {
				return part.toLowerCase()
			}

			return part
		})
		.join(' + ')
