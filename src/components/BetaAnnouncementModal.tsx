'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const BETA_MODAL_SEEN_KEY = 'hndb-beta-announcement-seen-v1'

const BetaAnnouncementModal = () => {
	const [open, setOpen] = useState(false)
	const [countdown, setCountdown] = useState(5)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const isSeen = localStorage.getItem(BETA_MODAL_SEEN_KEY) === '1'
		if (isSeen) return

		const openTimer = window.setTimeout(() => {
			setCountdown(5)
			setOpen(true)
		}, 0)

		return () => window.clearTimeout(openTimer)
	}, [])

	useEffect(() => {
		if (!open || countdown <= 0) return

		const timer = window.setTimeout(() => {
			setCountdown((prev) => Math.max(prev - 1, 0))
		}, 1000)

		return () => window.clearTimeout(timer)
	}, [open, countdown])

	const handleConfirm = () => {
		localStorage.setItem(BETA_MODAL_SEEN_KEY, '1')
		setOpen(false)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (nextOpen) setOpen(true)
			}}>
			<DialogContent
				className='sm:max-w-md'
				showCloseButton={false}
				onEscapeKeyDown={(e) => e.preventDefault()}
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>Beta Testing Notice</DialogTitle>
					<DialogDescription>
						This product is currently in beta testing.
						<br />
						If you have any questions, please contact us via the
						buttons below.
					</DialogDescription>
				</DialogHeader>

				<div className='flex items-center justify-center gap-4'>
					<Button
						asChild
						size='icon'
						variant='outline'>
						<a
							href='mailto:hnamhocit@gmail.com'
							aria-label='Contact via Gmail'
							title='Contact via Gmail'>
							<img
								src='/providers/google.svg'
								alt='Gmail'
								width={18}
								height={18}
							/>
						</a>
					</Button>

					<Button
						asChild
						size='icon'
						variant='outline'>
						<a
							href='https://facebook.com/hnamhocit'
							target='_blank'
							rel='noreferrer'
							aria-label='Contact via Facebook'
							title='Contact via Facebook'>
							<img
								src='/providers/facebook.png'
								alt='Facebook'
								width={18}
								height={18}
							/>
						</a>
					</Button>
				</div>

				<div className='flex justify-center'>
					<Button
						disabled={countdown > 0}
						onClick={handleConfirm}>
						{countdown > 0 ? `Confirm in ${countdown}s` : 'Confirm'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default BetaAnnouncementModal
