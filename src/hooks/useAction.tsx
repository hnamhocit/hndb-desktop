import { useState } from 'react'

export const useAction = (dataSourceId: string, database: string | null) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [actionType, setActionType] = useState<string | null>(null)

	const openAction = (type: string) => {
		setActionType(type)
	}

	const closeAction = () => {
		setActionType(null)
	}

	return {
		isSubmitting,
		setIsSubmitting,
		actionType,
		openAction,
		closeAction,
	}
}
