'use client'

import type { User } from '@supabase/supabase-js'
import { Loader2Icon } from 'lucide-react'
import { ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { connectionService, userService } from '@/services'
import { useConnectionStore, usePreferencesStore, useUserStore } from '@/stores'
import { isDesktopOAuthCallbackUrl, supabaseClient } from '@/utils/supabase'

export default function Providers({ children }: { children: ReactNode }) {
	const { t } = useI18n()
	const { isLoading, setUser, setIsLoading } = useUserStore()
	const setConnections = useConnectionStore((state) => state.setConnections)
	const setBulkStatuses = useConnectionStore((state) => state.setBulkStatuses)
	const initializePreferences = usePreferencesStore(
		(state) => state.initialize,
	)

	const initialized = useRef(false)
	const deepLinkSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
		null,
	)
	const handledDeepLinkUrlsRef = useRef(new Set<string>())
	const statusPollingRef = useRef<number | null>(null)

	useEffect(() => {
		void initializePreferences()
	}, [initializePreferences])

	useEffect(() => {
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
				typeof authUser.user_metadata?.name === 'string' ?
					authUser.user_metadata.name
				: typeof authUser.user_metadata?.full_name === 'string' ?
					authUser.user_metadata.full_name
				:	''

			const email = authUser.email || ''
			const fallbackName = displayName || email.split('@')[0] || t('common.user')
			const createdAt =
				authUser.created_at ? new Date(authUser.created_at) : new Date()
			const updatedAt =
				authUser.updated_at ? new Date(authUser.updated_at) : createdAt
			const avatarUrl =
				typeof authUser.user_metadata?.avatar_url === 'string' ?
					authUser.user_metadata.avatar_url
				: typeof authUser.user_metadata?.picture === 'string' ?
					authUser.user_metadata.picture
				:	null

			return {
				id: authUser.id,
				name: fallbackName,
				email,
				photo_url: avatarUrl,
				created_at: createdAt,
				updated_at: updatedAt,
			}
		}

		const fetchUser = async (authUser: User) => {
			try {
				const { data, error } = await userService.getUserById(
					authUser.id,
				)
				if (error || !data) {
					console.warn(
						'Failed to load user profile from users table, fallback to auth metadata:',
						error,
					)
					setUser(mapAuthUserToStoreUser(authUser))
					return
				}
				setUser(data)
			} catch (err) {
				console.error('Fetch user error:', err)
				setUser(mapAuthUserToStoreUser(authUser))
			}
		}

		const getOAuthPayload = (url: string) => {
			const callbackUrl = new URL(url)
			const hashParams = new URLSearchParams(
				callbackUrl.hash.startsWith('#') ?
					callbackUrl.hash.slice(1)
				:	callbackUrl.hash,
			)
			const getParam = (name: string) =>
				callbackUrl.searchParams.get(name) || hashParams.get(name)

			return {
				errorMessage:
					getParam('error_description') || getParam('error'),
				authCode: getParam('code'),
				accessToken: getParam('access_token'),
				refreshToken: getParam('refresh_token'),
			}
		}

		const processDeepLinkUrl = async (url: string) => {
			if (
				!isDesktopOAuthCallbackUrl(url) ||
				handledDeepLinkUrlsRef.current.has(url)
			) {
				return
			}

			handledDeepLinkUrlsRef.current.add(url)
			try {
				const { errorMessage, authCode, accessToken, refreshToken } =
					getOAuthPayload(url)

				if (errorMessage) {
					toast.error(errorMessage.replace(/\+/g, ' '))
					setUser(null)
					return
				}

				const {
					data: { session: existingSession },
				} = await supabaseClient.auth.getSession()
				if (existingSession?.user) {
					await fetchUser(existingSession.user)
					return
				}

				if (authCode) {
					const { data, error } =
						await supabaseClient.auth.exchangeCodeForSession(
							authCode,
						)
					if (error) {
						const loweredMessage = error.message.toLowerCase()
						if (
							loweredMessage.includes('invalid flow state') ||
							loweredMessage.includes('flow state has expired') ||
							loweredMessage.includes('code verifier not found')
						) {
							const {
								data: { session: recoveredSession },
							} = await supabaseClient.auth.getSession()
							if (recoveredSession?.user) {
								await fetchUser(recoveredSession.user)
								return
							}
						}

						toast.error(
							error.message ||
								t('auth.providerSignInFailed'),
						)
						setUser(null)
						return
					}

					if (data.session?.user) {
						await fetchUser(data.session.user)
					}
					return
				}

				if (accessToken && refreshToken) {
					const { data, error } =
						await supabaseClient.auth.setSession({
							access_token: accessToken,
							refresh_token: refreshToken,
						})
					if (error) {
						toast.error(
							error.message ||
								t('auth.providerSignInFailed'),
						)
						setUser(null)
						return
					}

					if (data.user) {
						await fetchUser(data.user)
					}
					return
				}

				toast.error(
					t('auth.callbackMissingPayload'),
				)
				setUser(null)
			} catch (error) {
				console.error('Failed to process OAuth callback URL:', error)
				toast.error(t('auth.providerSignInFailed'))
				setUser(null)
			}
		}

		const setupDesktopDeepLink = async () => {
			try {
				const { getCurrent, onOpenUrl } =
					await import('@tauri-apps/plugin-deep-link')

				// Xử lý URL nếu app được mở bởi deep link lúc khởi động
				const startUrls = await getCurrent()
				if (startUrls?.length) {
					for (const url of startUrls) {
						await processDeepLinkUrl(url)
					}
				}

				// Lắng nghe deep link khi app đang chạy (macOS)
				// Windows/Linux: single-instance plugin forward URL vào đây
				deepLinkSubscriptionRef.current = {
					unsubscribe: await onOpenUrl((urls) => {
						void (async () => {
							for (const url of urls) {
								await processDeepLinkUrl(url)
							}
						})()
					}),
				}
			} catch (error) {
				console.warn('Deep-link unavailable:', error)
			}
		}

		const ensureAuthStateFromSession = async () => {
			const {
				data: { session },
				error,
			} = await supabaseClient.auth.getSession()
			if (error) {
				toast.error(error.message)
				setUser(null)
				return
			}

			if (session?.user) {
				await fetchUser(session.user)
				return
			}

			setUser(null)
		}

		const initAuth = async () => {
			setIsLoading(true)
			try {
				try {
					await connectionService.resetSessions()

					const [connectionsResult, statusesResult] =
						await Promise.allSettled([
							connectionService.list(),
							connectionService.listStatuses(),
						])

					if (connectionsResult.status === 'fulfilled') {
						setConnections(connectionsResult.value)
					} else {
						throw connectionsResult.reason
					}

					if (statusesResult.status === 'fulfilled') {
						setBulkStatuses(statusesResult.value)
					} else {
						console.error(
							'Failed to bootstrap connection statuses:',
							statusesResult.reason,
						)
						setBulkStatuses({})
					}
				} catch (connectionError) {
					console.error(
						'Failed to bootstrap saved connections:',
						connectionError,
					)
					setConnections([])
					setBulkStatuses({})
				}

				await setupDesktopDeepLink()
				await ensureAuthStateFromSession()
			} catch (err) {
				console.error('Init auth error:', err)
				setUser(null)
			} finally {
				setIsLoading(false)
			}
		}

		initAuth()
		statusPollingRef.current = window.setInterval(() => {
			void syncConnectionStatuses()
		}, 10000)

		const handleWindowFocus = () => {
			void syncConnectionStatuses()
			void ensureAuthStateFromSession()
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void syncConnectionStatuses()
			}
		}

		window.addEventListener('focus', handleWindowFocus)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		const {
			data: { subscription },
		} = supabaseClient.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session?.user) {
				fetchUser(session.user)
			} else if (event === 'SIGNED_OUT') {
				setUser(null)
			} else if (event === 'TOKEN_REFRESHED' && session?.user) {
				// Optional: refresh user data nếu cần (nhưng thường không cần)
				// fetchUser(session.user.id)
			}
			// Các event khác: USER_UPDATED, PASSWORD_RECOVERY... xử lý nếu cần
		})

		const authSubscription = subscription

		// Cleanup
		return () => {
			deepLinkSubscriptionRef.current?.unsubscribe()
			deepLinkSubscriptionRef.current = null
			authSubscription.unsubscribe()
			if (statusPollingRef.current !== null) {
				window.clearInterval(statusPollingRef.current)
				statusPollingRef.current = null
			}
			window.removeEventListener('focus', handleWindowFocus)
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange,
			)
			initialized.current = false
		}
	}, [setBulkStatuses, setConnections, setIsLoading, setUser])

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<Loader2Icon
					className='animate-spin text-primary'
					size={64}
				/>
			</div>
		)
	}

	return children
}
