import { LoginSchema, RegisterSchema } from '@/schemas'
import { supabaseClient } from '@/utils'

export const authService = {
	async login(formData: LoginSchema) {
		return await supabaseClient.auth.signInWithPassword({
			email: formData.email,
			password: formData.password,
		})
	},

	async register(data: RegisterSchema) {
		return await supabaseClient.auth.signUp({
			email: data.email,
			password: data.password,
			options: {
				data: {
					name: data.name,
					photoURL: null,
				},
			},
		})
	},

	async logout() {
		await supabaseClient.auth.signOut()
	},
}
