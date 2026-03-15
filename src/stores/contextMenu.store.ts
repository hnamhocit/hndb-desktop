import { create } from 'zustand'

type DatabaseContextMenuTarget = {
	dataSourceId: string
	database: string | null
} | null

interface ContextMenuStore {
	isSubmitting: boolean
	setIsSubmitting: (value: boolean) => void

	target: DatabaseContextMenuTarget
	actionType: string | null

	openAction: (
		target: NonNullable<DatabaseContextMenuTarget>,
		actionType: string | null,
	) => void

	closeAction: () => void
}

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
	isSubmitting: false,
	setIsSubmitting: (value) => set({ isSubmitting: value }),

	target: null,
	actionType: null,

	openAction: (target, actionType) =>
		set({
			target,
			actionType,
		}),

	closeAction: () =>
		set({
			target: null,
			actionType: null,
		}),
}))
