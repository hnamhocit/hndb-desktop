import { create } from 'zustand'

import {
	type AppReleaseInfo,
	type AppUpdateCheckResult,
	type InstalledAppInfo,
	checkForAppUpdates,
	fetchReleaseByTag,
	getInstalledAppInfo,
} from '@/services/app.service'

interface AppStore {
	app: InstalledAppInfo
	currentRelease: AppReleaseInfo | null
	latestRelease: AppReleaseInfo | null
	hasUpdate: boolean
	checkedAt: string | null
	isCheckingForUpdates: boolean
	updateError: string | null
	initialize: () => Promise<InstalledAppInfo>
	checkForUpdates: (
		options?: {
			includeCurrentRelease?: boolean
		},
	) => Promise<AppUpdateCheckResult | null>
}

const DEFAULT_APP_INFO: InstalledAppInfo = {
	name: 'HNDB',
	version: '0.0.0',
}

export const useAppStore = create<AppStore>((set, get) => ({
	app: DEFAULT_APP_INFO,
	currentRelease: null,
	latestRelease: null,
	hasUpdate: false,
	checkedAt: null,
	isCheckingForUpdates: false,
	updateError: null,

	initialize: async () => {
		const app = await getInstalledAppInfo()
		set((state) =>
			state.app.name === app.name && state.app.version === app.version ?
				state
			:	{ app },
		)
		return app
	},

	checkForUpdates: async (options) => {
		set({ isCheckingForUpdates: true, updateError: null })

		try {
			const app =
				get().app.version !== DEFAULT_APP_INFO.version ?
					get().app
				:	await get().initialize()
			const result = await checkForAppUpdates({
				app,
				includeCurrentRelease: options?.includeCurrentRelease ?? false,
			})

			let currentRelease = result.currentRelease
			if (
				!currentRelease &&
				options?.includeCurrentRelease &&
				result.app.version
			) {
				currentRelease = await fetchReleaseByTag(result.app.version)
			}

			set({
				app: result.app,
				currentRelease:
					currentRelease ??
					(normalizeTag(result.latestRelease.tagName) ===
					normalizeTag(result.app.version) ?
						result.latestRelease
					:	null),
				latestRelease: result.latestRelease,
				hasUpdate: result.hasUpdate,
				checkedAt: result.checkedAt,
				isCheckingForUpdates: false,
				updateError: null,
			})

			return {
				...result,
				currentRelease:
					currentRelease ??
					(normalizeTag(result.latestRelease.tagName) ===
					normalizeTag(result.app.version) ?
						result.latestRelease
					:	null),
			}
		} catch (error) {
			set({
				isCheckingForUpdates: false,
				updateError:
					error instanceof Error ? error.message : 'Failed to check updates.',
				checkedAt: new Date().toISOString(),
			})
			return null
		}
	},
}))

const normalizeTag = (value: string) => value.trim().replace(/^v/i, '')
