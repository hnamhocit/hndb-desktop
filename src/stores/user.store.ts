import { create } from 'zustand'

import { IUser } from '@/interfaces'

interface UserStore {
	user: IUser | null
	setUser: (user: IUser | null) => void

	isLoading: boolean
	setIsLoading: (isLoading: boolean) => void
}

export const useUserStore = create<UserStore>((set) => ({
	user: null,
	setUser: (user) => set({ user }),

	isLoading: false,
	setIsLoading: (isLoading) => set({ isLoading }),
}))
