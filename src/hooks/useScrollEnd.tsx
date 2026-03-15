import { RefObject, useEffect, useRef } from 'react'

interface UseScrollEndOptions {
	containerRef: RefObject<HTMLElement | null>
	hasMore?: boolean
	isLoading?: boolean
	onEndReached?: () => void | Promise<void>
	threshold?: number
	enabled?: boolean
}

export const useScrollEnd = ({
	containerRef,
	hasMore = false,
	isLoading = false,
	onEndReached,
	threshold = 300,
	enabled = true,
}: UseScrollEndOptions) => {
	const isRequestingRef = useRef(false)

	useEffect(() => {
		if (!isLoading) {
			isRequestingRef.current = false
		}
	}, [isLoading])

	useEffect(() => {
		const el = containerRef.current
		if (!el || !enabled || !onEndReached) return

		const handleScroll = () => {
			if (!hasMore || isLoading || isRequestingRef.current) return

			const distanceToBottom =
				el.scrollHeight - el.scrollTop - el.clientHeight

			if (distanceToBottom <= threshold) {
				isRequestingRef.current = true
				void onEndReached()
			}
		}

		el.addEventListener('scroll', handleScroll, { passive: true })

		handleScroll()

		return () => {
			el.removeEventListener('scroll', handleScroll)
		}
	}, [containerRef, enabled, hasMore, isLoading, onEndReached, threshold])
}
