import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { useI18n } from '@/hooks'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createLoginSchema, LoginSchema } from '@/schemas'
import { authService } from '@/services'

const LoginForm = () => {
	const { t } = useI18n()
	const loginSchema = useMemo(() => createLoginSchema(t), [t])

	const {
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<LoginSchema>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	})

	const onSubmit = async (values: LoginSchema) => {
		try {
			const { error } = await authService.login(values)
			if (error) {
				toast.error(
					t('auth.loginFailed', {
						message: error.message,
					}),
					{
					position: 'top-center',
					},
				)
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			toast.error(t('auth.loginUnexpectedError'), {
				position: 'top-center',
			})
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('common.email')}</FieldLabel>

					<Controller
						control={control}
						name='email'
						render={({ field }) => (
							<Input
								placeholder={t('auth.emailPlaceholder')}
								{...field}
							/>
						)}
					/>

					{errors.email && (
						<FieldError>{errors.email.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel>{t('common.password')}</FieldLabel>

					<Controller
						control={control}
						name='password'
						render={({ field }) => (
							<PasswordInput
								placeholder={t('auth.passwordPlaceholder')}
								{...field}
							/>
						)}
					/>

					{errors.password && (
						<FieldError>{errors.password.message}</FieldError>
					)}
				</Field>

				<Button
					disabled={isSubmitting}
					type='submit'
					className='w-full mt-2'>
					{t('auth.loginButton')}
				</Button>
			</FieldGroup>
		</form>
	)
}

export default LoginForm
