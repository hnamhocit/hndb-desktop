import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/hooks'
import { Button } from '@/components/ui/button'
import { notifyError } from '@/utils'
import { desktopOAuthRedirectTo, supabaseClient } from '@/utils/supabase'

const OAUTH_BUTTON_UNLOCK_TIMEOUT_MS = 45_000

const Providers = () => {
	const { t } = useI18n()
	const [disabled, setDisabled] = useState(false)
	const unlockTimeoutRef = useRef<number | null>(null)

	const clearUnlockTimeout = () => {
		if (unlockTimeoutRef.current !== null) {
			window.clearTimeout(unlockTimeoutRef.current)
			unlockTimeoutRef.current = null
		}
	}

	const scheduleUnlockFallback = () => {
		clearUnlockTimeout()
		unlockTimeoutRef.current = window.setTimeout(() => {
			setDisabled(false)
			unlockTimeoutRef.current = null
		}, OAUTH_BUTTON_UNLOCK_TIMEOUT_MS)
	}

	useEffect(() => {
		const {
			data: { subscription },
		} = supabaseClient.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				clearUnlockTimeout()
				setDisabled(false)
			}
		})

		return () => {
			clearUnlockTimeout()
			subscription.unsubscribe()
		}
	}, [])

	const signInWithProvider = async (provider: 'google' | 'github') => {
		setDisabled(true)
		clearUnlockTimeout()

		try {
			const { data, error } = await supabaseClient.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: desktopOAuthRedirectTo, // 'hndb://auth/callback'
					skipBrowserRedirect: true,
					...(provider === 'google' ?
						{
							queryParams: {
								access_type: 'offline',
								prompt: 'consent',
							},
						}
					:	{}),
				},
			})

			if (error) {
				toast.error(error.message)
				setDisabled(false)
				return
			}
			if (!data?.url) {
				toast.error(t('auth.oauthUrlMissing'))
				setDisabled(false)
				return
			}

			await openUrl(data.url) // mở system browser
			scheduleUnlockFallback()
		} catch (error) {
			notifyError(
				error,
				t('auth.providerLoginFailed', {
					provider,
				}),
			)
			setDisabled(false)
		}
	}

	return (
		<div className='grid grid-cols-2 gap-4'>
			<Button
				disabled={disabled}
				variant='outline'
				className='h-10'
				onClick={() => signInWithProvider('google')}>
				<img
					src='/providers/google.svg'
					width={16}
					height={16}
					alt='Google Logo'
				/>
				Google
			</Button>

			<Button
				disabled={disabled}
				variant='outline'
				className='h-10'
				onClick={() => signInWithProvider('github')}>
				<img
					src='/providers/github.png'
					width={16}
					height={16}
					alt='GitHub Logo'
				/>
				GitHub
			</Button>
		</div>
	)
}

export default Providers
