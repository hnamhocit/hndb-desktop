'use client'

import { Loader2Icon } from 'lucide-react'
import { ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { usersService } from '@/services'
import { usePreferencesStore, useUserStore } from '@/stores'
import { supabaseClient } from '@/utils'

export default function Providers({ children }: { children: ReactNode }) {
	const { isLoading, setUser, setIsLoading } = useUserStore()
	const initializePreferences = usePreferencesStore(
		(state) => state.initialize,
	)

	const initialized = useRef(false)
	const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

	useEffect(() => {
		void initializePreferences()
	}, [initializePreferences])

	useEffect(() => {
		if (initialized.current) return
		initialized.current = true

		const initAuth = async () => {
			setIsLoading(true)
			try {
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
				const { data, error } = await usersService.getUserById(userId)
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
			initialized.current = false
		}
	}, [])

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
