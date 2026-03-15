import axios from 'axios'

const env = import.meta.env as Record<string, string | undefined>

export const api = axios.create({
	baseURL: env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
	timeout: 3000,
	headers: {
		'Content-Type': 'application/json',
	},
})
