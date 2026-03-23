import { isTauri } from '@tauri-apps/api/core'

type TauriWindow = Window & {
	__TAURI__?: unknown
	__TAURI_INTERNALS__?: unknown
	isTauri?: boolean
}

export const isDesktopApp = () => {
	if (typeof window === 'undefined') {
		return false
	}

	if (isTauri()) {
		return true
	}

	if (typeof navigator !== 'undefined') {
		const userAgent = navigator.userAgent.toLowerCase()
		if (userAgent.includes('tauri')) {
			return true
		}
	}

	const tauriWindow = window as TauriWindow
	return Boolean(
		tauriWindow.isTauri ||
			tauriWindow.__TAURI__ ||
			tauriWindow.__TAURI_INTERNALS__,
	)
}
