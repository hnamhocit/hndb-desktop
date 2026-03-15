import { supabaseClient } from '@/utils'

export const usersService = {
	async getUserById(userId: string) {
		return await supabaseClient
			.from('users')
			.select('*')
			.eq('id', userId)
			.single()
	},
}
