import z from 'zod'

const passwordSchema = z
	.string()
	.regex(
		/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
		'At least 8 characters, including uppercase, lowercase, number, and special character.',
	)

const loginSchema = z.object({
	email: z.email({ message: 'Invalid email address.' }),
	password: passwordSchema,
})

export type LoginSchema = z.infer<typeof loginSchema>

const registerSchema = z.object({
	name: z
		.string()
		.min(2, { message: 'Name must be at least 2 characters long.' })
		.max(35, { message: 'Name must be at most 35 characters long.' }),
	email: z.email({ message: 'Invalid email address.' }),
	password: passwordSchema,
})

export type RegisterSchema = z.infer<typeof registerSchema>

export { loginSchema, registerSchema }
