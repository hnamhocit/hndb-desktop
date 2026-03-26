import type { Update } from '@tauri-apps/plugin-updater'
import { create } from 'zustand'

import {
	type AppReleaseInfo,
	type AppUpdateCheckResult,
	type InstalledAppInfo,
	checkForAppUpdates,
	getInstalledAppInfo,
} from '@/services/app.service'

interface AppStore {
	app: InstalledAppInfo
	latestRelease: AppReleaseInfo | null
	hasUpdate: boolean
	checkedAt: string | null
	isCheckingForUpdates: boolean
	isInstallingUpdate: boolean
	updateError: string | null
	pendingUpdate: Update | null
	initialize: () => Promise<InstalledAppInfo>
	checkForUpdates: () => Promise<AppUpdateCheckResult | null>
	downloadAndInstallUpdate: () => Promise<boolean>
}

const DEFAULT_APP_INFO: InstalledAppInfo = {
	name: 'HNDB',
	version: '0.0.0',
}

const closePendingUpdate = async (update: Update | null) => {
	if (!update) return

	try {
		await update.close()
	} catch {
		// Ignore stale updater resource cleanup failures.
	}
}

export const useAppStore = create<AppStore>((set, get) => ({
	app: DEFAULT_APP_INFO,
	latestRelease: null,
	hasUpdate: false,
	checkedAt: null,
	isCheckingForUpdates: false,
	isInstallingUpdate: false,
	updateError: null,
	pendingUpdate: null,

	initialize: async () => {
		const app = await getInstalledAppInfo()
		set((state) =>
			state.app.name === app.name && state.app.version === app.version ?
				state
			:	{ app },
		)
		return app
	},

	checkForUpdates: async () => {
		set({ isCheckingForUpdates: true, updateError: null })

		try {
			const previousUpdate = get().pendingUpdate
			await closePendingUpdate(previousUpdate)

			const app =
				get().app.version !== DEFAULT_APP_INFO.version ?
					get().app
				:	await get().initialize()
			const result = await checkForAppUpdates({ app })

			set({
				app: result.app,
				latestRelease: result.latestRelease,
				hasUpdate: result.hasUpdate,
				checkedAt: result.checkedAt,
				isCheckingForUpdates: false,
				updateError: null,
				pendingUpdate: result.update,
			})

			return result
		} catch (error) {
			set({
				isCheckingForUpdates: false,
				updateError:
					error instanceof Error ? error.message : 'Failed to check updates.',
				checkedAt: new Date().toISOString(),
				hasUpdate: false,
				pendingUpdate: null,
			})
			return null
		}
	},

	downloadAndInstallUpdate: async () => {
		set({ isInstallingUpdate: true, updateError: null })

		try {
			const pendingUpdate =
				get().pendingUpdate ?? (await get().checkForUpdates())?.update ?? null

			if (!pendingUpdate) {
				set({
					isInstallingUpdate: false,
					hasUpdate: false,
				})
				return false
			}

			await pendingUpdate.downloadAndInstall()
			await closePendingUpdate(pendingUpdate)

			set({
				isInstallingUpdate: false,
				pendingUpdate: null,
			})

			return true
		} catch (error) {
			set({
				isInstallingUpdate: false,
				updateError:
					error instanceof Error ?
						error.message
					:	'Failed to download and install update.',
			})
			return false
		}
	},
}))
