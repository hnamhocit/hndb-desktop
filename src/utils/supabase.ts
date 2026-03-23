import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
	import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
	import.meta.env.VITE_SUPABASE_URL ||
	'https://octduxtmterurkdkqtur.supabase.co'
const supabaseAnonKey =
	import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	'sb_publishable_MYEh8xfPAeMWQXXYUPcimw_hSL5HBbL'

export const desktopOAuthScheme = 'hndb'
export const desktopOAuthRedirectTo = 'https://www.hndb.space/auth/callback'

const getOAuthPayloadFromUrl = (url: URL) => {
	const hashParams = new URLSearchParams(
		url.hash.startsWith('#') ? url.hash.slice(1) : url.hash,
	)
	const getParam = (name: string) =>
		url.searchParams.get(name) || hashParams.get(name)

	return {
		code: getParam('code'),
		accessToken: getParam('access_token'),
		refreshToken: getParam('refresh_token'),
		error: getParam('error') || getParam('error_description'),
	}
}

export const isDesktopOAuthCallbackUrl = (url: string) => {
	try {
		const parsedUrl = new URL(url.trim())
		if (parsedUrl.protocol !== `${desktopOAuthScheme}:`) {
			return false
		}

		const normalizedPath =
			parsedUrl.pathname.endsWith('/') && parsedUrl.pathname.length > 1 ?
				parsedUrl.pathname.slice(0, -1)
				: parsedUrl.pathname
		const normalizedHost = parsedUrl.hostname.toLowerCase()

		const looksLikeCallbackRoute =
			(normalizedHost === 'auth' && normalizedPath === '/callback') ||
			(normalizedHost === 'callback' &&
				(normalizedPath === '/' || normalizedPath === '')) ||
			normalizedPath === '/auth/callback' ||
			normalizedPath === '/callback'

		if (looksLikeCallbackRoute) {
			return true
		}

		const payload = getOAuthPayloadFromUrl(parsedUrl)
		return Boolean(
			payload.code ||
			(payload.accessToken && payload.refreshToken) ||
			payload.error,
		)
	} catch {
		return false
	}
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		flowType: 'pkce',
		detectSessionInUrl: false,
		autoRefreshToken: true,
		persistSession: true,
	},
})
