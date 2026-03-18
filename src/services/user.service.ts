import { supabaseClient } from '@/utils/supabase'

export const userService = {
	async getUserById(userId: string) {
		return await supabaseClient
			.from('users')
			.select('*')
			.eq('id', userId)
			.single()
	},
}
