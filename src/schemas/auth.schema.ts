import z from 'zod'

import type { TranslationKey } from '@/i18n/messages'
import { translate } from '@/i18n/messages'

type TranslateFn = (
	key: TranslationKey,
	params?: Record<string, string | number>,
) => string

const defaultTranslate: TranslateFn = (key, params) =>
	translate('en', key, params)

const createPasswordSchema = (t: TranslateFn) =>
	z.string().regex(
		/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
		t('auth.error.passwordRule'),
	)

export const createLoginSchema = (t: TranslateFn = defaultTranslate) =>
	z.object({
		email: z.email({ message: t('auth.error.invalidEmail') }),
		password: createPasswordSchema(t),
	})

export const createRegisterSchema = (t: TranslateFn = defaultTranslate) =>
	z.object({
		name: z
			.string()
			.min(2, { message: t('auth.error.nameMin') })
			.max(35, { message: t('auth.error.nameMax') }),
		email: z.email({ message: t('auth.error.invalidEmail') }),
		password: createPasswordSchema(t),
	})

export const loginSchema = createLoginSchema()
export const registerSchema = createRegisterSchema()

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
