'use client'

import type { User } from '@supabase/supabase-js'
import { listen } from '@tauri-apps/api/event'
import { ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { connectionService, formatReleaseDate, userService } from '@/services'
import {
	useAppStore,
	useConnectionStore,
	usePreferencesStore,
	useUserStore,
} from '@/stores'
import { isDesktopOAuthCallbackUrl, supabaseClient } from '@/utils/supabase'

export default function Providers({ children }: { children: ReactNode }) {
	// ✅ SỬ DỤNG SELECTORS: Đảm bảo các hàm (actions) có tham chiếu ổn định, không gây loop
	const setUser = useUserStore((state) => state.setUser)
	const setIsLoading = useUserStore((state) => state.setIsLoading)

	const setConnections = useConnectionStore((state) => state.setConnections)
	const setBulkStatuses = useConnectionStore((state) => state.setBulkStatuses)

	const initializeApp = useAppStore((state) => state.initialize)
	const checkForUpdates = useAppStore((state) => state.checkForUpdates)

	const initializePreferences = usePreferencesStore((state) => state.initialize)

	const { t, language } = useI18n()

	const initialized = useRef(false)
	const deepLinkSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
	const eventUnlistenRef = useRef<(() => void) | null>(null)
	const handledDeepLinkUrlsRef = useRef(new Set<string>())
	const statusPollingRef = useRef<number | null>(null)
	const notifiedReleaseTagRef = useRef<string | null>(null)
	const localeRef = useRef({ t, language })

	// Khởi tạo Preferences riêng biệt
	useEffect(() => {
		void initializePreferences()
	}, [initializePreferences])

	useEffect(() => {
		localeRef.current = { t, language }
	}, [language, t])

	useEffect(() => {
		// Chống chạy 2 lần trong Strict Mode
		if (initialized.current) return
		initialized.current = true

		const syncConnectionStatuses = async () => {
			try {
				const statuses = await connectionService.listStatuses()
				setBulkStatuses(statuses)
			} catch (error) {
				console.error('Failed to sync connection statuses:', error)
			}
		}

		const mapAuthUserToStoreUser = (authUser: User) => {
			const displayName =
				typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name
					: typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name
						: ''

			const email = authUser.email || ''
			const fallbackName = displayName || email.split('@')[0] || t('common.user')
			const avatarUrl =
				typeof authUser.user_metadata?.avatar_url === 'string' ? authUser.user_metadata.avatar_url
					: typeof authUser.user_metadata?.picture === 'string' ? authUser.user_metadata.picture
						: null

			return {
				id: authUser.id,
				name: fallbackName,
				email,
				photo_url: avatarUrl,
				created_at: authUser.created_at ? new Date(authUser.created_at) : new Date(),
				updated_at: authUser.updated_at ? new Date(authUser.updated_at) : new Date(),
			}
		}

		const fetchUser = async (authUser: User) => {
			try {
				const { data, error } = await userService.getUserById(authUser.id)
				if (error || !data) {
					setUser(mapAuthUserToStoreUser(authUser))
					return
				}
				setUser(data)
			} catch (err) {
				console.error('Fetch user error:', err)
				setUser(mapAuthUserToStoreUser(authUser))
			}
		}

		const notifyIfUpdateAvailable = async () => {
			const result = await checkForUpdates()
			if (!result?.hasUpdate || !result.latestRelease) {
				return
			}

			if (notifiedReleaseTagRef.current === result.latestRelease.version) {
				return
			}

			notifiedReleaseTagRef.current = result.latestRelease.version
			toast.info(
				localeRef.current.t('updates.toastAvailable', {
					version: result.latestRelease.version,
					date: formatReleaseDate(
						result.latestRelease.publishedAt,
						localeRef.current.language,
					),
				}),
			)
		}

		const processDeepLinkUrl = async (url: string) => {
			if (!isDesktopOAuthCallbackUrl(url) || handledDeepLinkUrlsRef.current.has(url)) return

			setIsLoading(true)
			handledDeepLinkUrlsRef.current.add(url)

			try {
				const callbackUrl = new URL(url)
				const hashParams = new URLSearchParams(
					callbackUrl.hash.startsWith('#') ? callbackUrl.hash.slice(1) : callbackUrl.hash
				)
				const authCode = callbackUrl.searchParams.get('code') || hashParams.get('code')
				const errorDesc = callbackUrl.searchParams.get('error_description') || hashParams.get('error_description')

				if (errorDesc) {
					toast.error(errorDesc.replace(/\+/g, ' '))
					return
				}

				if (authCode) {
					const { data, error } = await supabaseClient.auth.exchangeCodeForSession(authCode)
					if (error) throw error
					if (data.session?.user) await fetchUser(data.session.user)
				}
			} catch (error: any) {
				console.error('Deep link error:', error)
				toast.error(error.message || t('auth.providerSignInFailed'))
			} finally {
				setIsLoading(false)
			}
		}

		const setupDesktopDeepLink = async () => {
			try {
				const { getCurrent, onOpenUrl } = await import('@tauri-apps/plugin-deep-link')

				// 1. Lắng nghe Event từ Rust (Dành cho Windows/Linux Single Instance)
				const unlisten = await listen<string>('deep-link-received', (event) => {
					void processDeepLinkUrl(event.payload)
				})
				eventUnlistenRef.current = unlisten

				// 2. Kiểm tra URL lúc khởi tạo
				const startUrls = await getCurrent()
				if (startUrls?.length) {
					for (const url of startUrls) void processDeepLinkUrl(url)
				}

				// 3. Lắng nghe URL khi app đang chạy (macOS)
				const unsubscribe = await onOpenUrl((urls) => {
					for (const url of urls) void processDeepLinkUrl(url)
				})
				deepLinkSubscriptionRef.current = { unsubscribe }
			} catch (error) {
				console.warn('Deep-link unavailable:', error)
			}
		}

		const initAuth = async () => {
			setIsLoading(true)
			try {
				await initializeApp()
				await notifyIfUpdateAvailable()

				// Reset và load connections
				await connectionService.resetSessions()
				const connections = await connectionService.list()
				setConnections(connections)

				// Đồng bộ status
				await syncConnectionStatuses()

				// Setup Deep Link & Session
				await setupDesktopDeepLink()
				const { data: { session } } = await supabaseClient.auth.getSession()
				if (session?.user) {
					await fetchUser(session.user)
				} else {
					setUser(null)
				}
			} catch (err) {
				console.error('Init auth error:', err)
				setUser(null)
			} finally {
				setIsLoading(false)
			}
		}

		void initAuth()

		// Polling & Window Focus
		statusPollingRef.current = window.setInterval(syncConnectionStatuses, 10000)
		const handleFocus = () => {
			void syncConnectionStatuses()
			void supabaseClient.auth.getSession().then(({ data }) => {
				if (data.session?.user) fetchUser(data.session.user)
			})
		}

		window.addEventListener('focus', handleFocus)

		// Auth Listener
		const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session?.user) {
				void fetchUser(session.user)
				void notifyIfUpdateAvailable()
			}
			else if (event === 'SIGNED_OUT') setUser(null)
		})

		return () => {
			window.clearInterval(statusPollingRef.current!)
			window.removeEventListener('focus', handleFocus)
			subscription.unsubscribe()
			deepLinkSubscriptionRef.current?.unsubscribe()
			if (eventUnlistenRef.current) eventUnlistenRef.current()
			initialized.current = false
		}
		// ✅ CHỈ ĐƯA CÁC HÀM ỔN ĐỊNH VÀO DEPENDENCY: Bỏ 't' để tránh vòng lặp
	}, [
		checkForUpdates,
		initializeApp,
		setBulkStatuses,
		setConnections,
		setIsLoading,
		setUser,
	])

	return children
}
