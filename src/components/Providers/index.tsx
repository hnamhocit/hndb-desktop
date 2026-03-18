'use client'

import { Loader2Icon } from 'lucide-react'
import { ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { connectionService, userService } from '@/services'
import { useConnectionStore, usePreferencesStore, useUserStore } from '@/stores'
import { supabaseClient } from '@/utils/supabase'

export default function Providers({ children }: { children: ReactNode }) {
	const { isLoading, setUser, setIsLoading } = useUserStore()
	const setConnections = useConnectionStore((state) => state.setConnections)
	const setBulkStatuses = useConnectionStore((state) => state.setBulkStatuses)
	const initializePreferences = usePreferencesStore(
		(state) => state.initialize,
	)

	const initialized = useRef(false)
	const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
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

		const initAuth = async () => {
			setIsLoading(true)
			try {
				try {
					await connectionService.resetSessions()

					const [connectionsResult, statusesResult] = await Promise.allSettled([
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
					await fetchUser(session.user.id)
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

		const fetchUser = async (userId: string) => {
			try {
				const { data, error } = await userService.getUserById(userId)
				if (error) {
					toast.error(error.message || 'Failed to fetch user data')
					setUser(null)
					return
				}
				setUser(data)
			} catch (err) {
				console.error('Fetch user error:', err)
				setUser(null)
			}
		}

		initAuth()
		statusPollingRef.current = window.setInterval(() => {
			void syncConnectionStatuses()
		}, 10000)

		const handleWindowFocus = () => {
			void syncConnectionStatuses()
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
				fetchUser(session.user.id)
			} else if (event === 'SIGNED_OUT') {
				setUser(null)
			} else if (event === 'TOKEN_REFRESHED' && session?.user) {
				// Optional: refresh user data nếu cần (nhưng thường không cần)
				// fetchUser(session.user.id)
			}
			// Các event khác: USER_UPDATED, PASSWORD_RECOVERY... xử lý nếu cần
		})

		subscriptionRef.current = subscription

		// Cleanup
		return () => {
			subscriptionRef.current?.unsubscribe()
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
