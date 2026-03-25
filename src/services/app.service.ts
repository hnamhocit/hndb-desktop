import { getName, getVersion } from '@tauri-apps/api/app'

import packageJson from '../../package.json'
import type { AppLanguage } from './preferences.service'

const GITHUB_OWNER = 'hnamhocit'
const GITHUB_REPO = 'hndb'
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`

export const APP_REPOSITORY_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
export const APP_RELEASES_URL = `${APP_REPOSITORY_URL}/releases`
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
	tagName: string
	version: string
	name: string
	body: string
	htmlUrl: string
	publishedAt: string | null
	prerelease: boolean
}

export interface AppUpdateCheckResult {
	app: InstalledAppInfo
	latestRelease: AppReleaseInfo
	currentRelease: AppReleaseInfo | null
	hasUpdate: boolean
	checkedAt: string
}

const normalizeReleaseVersion = (value: string) =>
	value.trim().replace(/^v/i, '')

const tokenizeVersion = (value: string) =>
	normalizeReleaseVersion(value)
		.split(/[\.\-_]+/)
		.filter(Boolean)
		.map((segment) => {
			const numeric = Number.parseInt(segment, 10)
			return Number.isNaN(numeric) ? segment.toLowerCase() : numeric
		})

export const compareVersions = (left: string, right: string) => {
	const leftTokens = tokenizeVersion(left)
	const rightTokens = tokenizeVersion(right)
	const maxLength = Math.max(leftTokens.length, rightTokens.length)

	for (let index = 0; index < maxLength; index += 1) {
		const leftToken = leftTokens[index]
		const rightToken = rightTokens[index]

		if (leftToken === undefined) return -1
		if (rightToken === undefined) return 1

		if (typeof leftToken === 'number' && typeof rightToken === 'number') {
			if (leftToken > rightToken) return 1
			if (leftToken < rightToken) return -1
			continue
		}

		const leftValue = String(leftToken)
		const rightValue = String(rightToken)
		if (leftValue > rightValue) return 1
		if (leftValue < rightValue) return -1
	}

	return 0
}

const mapGithubRelease = (input: unknown): AppReleaseInfo => {
	if (!input || typeof input !== 'object') {
		throw new Error('Invalid release payload.')
	}

	const payload = input as Record<string, unknown>
	const tagName =
		typeof payload.tag_name === 'string' ? payload.tag_name.trim() : ''
	const htmlUrl =
		typeof payload.html_url === 'string' ? payload.html_url.trim() : ''

	if (!tagName || !htmlUrl) {
		throw new Error('Missing release tag or url.')
	}

	return {
		tagName,
		version: normalizeReleaseVersion(tagName),
		name:
			typeof payload.name === 'string' && payload.name.trim() ?
				payload.name.trim()
			:	tagName,
		body: typeof payload.body === 'string' ? payload.body : '',
		htmlUrl,
		publishedAt:
			typeof payload.published_at === 'string' ?
				payload.published_at
			:	null,
		prerelease: Boolean(payload.prerelease),
	}
}

const fetchGithubRelease = async (path: string) => {
	const response = await fetch(`${GITHUB_API_BASE}${path}`, {
		headers: {
			Accept: 'application/vnd.github+json',
		},
	})

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw new Error(`GitHub release request failed with status ${response.status}.`)
	}

	return mapGithubRelease(await response.json())
}

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

export const fetchLatestRelease = async () =>
	fetchGithubRelease('/releases/latest')

export const fetchReleaseByTag = async (tagOrVersion: string) => {
	const normalizedVersion = normalizeReleaseVersion(tagOrVersion)
	return (
		(await fetchGithubRelease(`/releases/tags/v${normalizedVersion}`)) ??
		(await fetchGithubRelease(`/releases/tags/${normalizedVersion}`))
	)
}

export const checkForAppUpdates = async (
	options?: {
		app?: InstalledAppInfo
		includeCurrentRelease?: boolean
	},
): Promise<AppUpdateCheckResult> => {
	const app = options?.app ?? (await getInstalledAppInfo())
	const latestRelease = await fetchLatestRelease()

	if (!latestRelease) {
		throw new Error('Latest release not found.')
	}

	const currentRelease =
		options?.includeCurrentRelease ?
			(await fetchReleaseByTag(app.version)) ??
			(normalizeReleaseVersion(latestRelease.tagName) ===
			normalizeReleaseVersion(app.version) ?
				latestRelease
			:	null)
		:	null

	return {
		app,
		latestRelease,
		currentRelease,
		hasUpdate: compareVersions(latestRelease.version, app.version) > 0,
		checkedAt: new Date().toISOString(),
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
