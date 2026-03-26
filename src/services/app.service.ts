import { getName, getVersion } from '@tauri-apps/api/app'
import { check, type Update } from '@tauri-apps/plugin-updater'

import packageJson from '../../package.json'
import type { AppLanguage } from './preferences.service'

const GITHUB_OWNER = 'hnamhocit'
const GITHUB_REPO = 'hndb'

export const APP_REPOSITORY_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
export const APP_RELEASES_URL = `${APP_REPOSITORY_URL}/releases`
export const APP_UPDATER_MANIFEST_URL =
	`${APP_RELEASES_URL}/latest/download/latest.json`
export const APP_TECH_STACK = [
	'Tauri 2',
	'React 18',
	'TypeScript 5',
	'Vite 6',
	'Zustand',
	'Supabase',
	'SQLx',
] as const

export interface InstalledAppInfo {
	name: string
	version: string
}

export interface AppReleaseInfo {
	version: string
	notes: string
	publishedAt: string | null
	rawJson: Record<string, unknown>
}

export interface AppUpdateCheckResult {
	app: InstalledAppInfo
	latestRelease: AppReleaseInfo | null
	hasUpdate: boolean
	checkedAt: string
	update: Update | null
}

const mapReleaseManifest = (input: unknown): AppReleaseInfo => {
	if (!input || typeof input !== 'object') {
		throw new Error('Invalid updater manifest payload.')
	}

	const payload = input as Record<string, unknown>
	const version =
		typeof payload.version === 'string' ? payload.version.trim() : ''

	if (!version) {
		throw new Error('Missing updater manifest version.')
	}

	return {
		version,
		notes: typeof payload.notes === 'string' ? payload.notes : '',
		publishedAt:
			typeof payload.pub_date === 'string' ? payload.pub_date : null,
		rawJson: payload,
	}
}

const mapPendingUpdate = (update: Update): AppReleaseInfo => ({
	version: update.version,
	notes: update.body ?? '',
	publishedAt: update.date ?? null,
	rawJson: update.rawJson,
})

export const getInstalledAppInfo = async (): Promise<InstalledAppInfo> => {
	const fallbackName = packageJson.name.toUpperCase()
	const fallbackVersion = packageJson.version

	try {
		const [name, version] = await Promise.all([getName(), getVersion()])
		return {
			name: name || fallbackName,
			version: version || fallbackVersion,
		}
	} catch {
		return {
			name: fallbackName,
			version: fallbackVersion,
		}
	}
}

export const fetchLatestRelease = async (): Promise<AppReleaseInfo | null> => {
	const response = await fetch(APP_UPDATER_MANIFEST_URL, {
		headers: {
			Accept: 'application/json',
		},
	})

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw new Error(
			`GitHub updater manifest request failed with status ${response.status}.`,
		)
	}

	return mapReleaseManifest(await response.json())
}

export const checkForAppUpdates = async (
	options?: {
		app?: InstalledAppInfo
	},
): Promise<AppUpdateCheckResult> => {
	const app = options?.app ?? (await getInstalledAppInfo())
	let latestRelease: AppReleaseInfo | null = null
	let update: Update | null = null
	let manifestError: Error | null = null

	try {
		latestRelease = await fetchLatestRelease()
	} catch (error) {
		manifestError =
			error instanceof Error ?
				error
			:	new Error('Failed to fetch updater manifest.')
	}

	try {
		update = await check()
	} catch (error) {
		if (manifestError) {
			throw error
		}

		throw (
			error instanceof Error ?
				error
			:	new Error('Failed to check updates.')
		)
	}

	const resolvedLatestRelease =
		update ? mapPendingUpdate(update)
		: latestRelease

	return {
		app,
		latestRelease: resolvedLatestRelease,
		hasUpdate: Boolean(update),
		checkedAt: new Date().toISOString(),
		update,
	}
}

export const formatReleaseDate = (
	value: string | null | undefined,
	language: AppLanguage,
) => {
	if (!value) {
		return language === 'vi' ? 'Chua ro' : 'Unknown'
	}

	const parsedDate = new Date(value)
	if (Number.isNaN(parsedDate.getTime())) {
		return language === 'vi' ? 'Chua ro' : 'Unknown'
	}

	return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(parsedDate)
}
