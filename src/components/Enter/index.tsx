'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/hooks'
import LoginForm from './LoginForm'
import Providers from './Providers'
import RegisterForm from './RegisterForm'

export default function Enter() {
	const { t } = useI18n()

	return (
		<div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 p-4 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-900'>
			<div className='pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-700/30' />
			<div className='pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-700/25' />

			<Card className='relative w-full max-w-md border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/85'>
				<CardHeader className='space-y-2 text-center'>
					<div className='mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground'>
						<img
							src='/logo.png'
							alt='HNDB'
							width={20}
							height={20}
							className='rounded-full'
						/>
						{t('enter.account')}
					</div>

					<CardTitle className='text-2xl font-bold tracking-tight'>
						{t('enter.welcomeBack')}
					</CardTitle>
					<CardDescription className='text-sm'>
						{t('enter.subtitle')}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Tabs
						defaultValue='login'
						className='w-full'>
						<TabsList className='mb-6 grid w-full grid-cols-2 rounded-lg bg-muted/70 p-1'>
							<TabsTrigger value='login'>
								{t('enter.loginTab')}
							</TabsTrigger>
							<TabsTrigger value='register'>
								{t('enter.registerTab')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value='login'>
							<LoginForm />
						</TabsContent>
						<TabsContent value='register'>
							<RegisterForm />
						</TabsContent>
					</Tabs>

					<div className='relative my-6'>
						<div className='absolute inset-0 flex items-center'>
							<span className='w-full border-t border-border/70' />
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='rounded bg-background px-2 text-muted-foreground'>
								{t('enter.orContinueWith')}
							</span>
						</div>
					</div>

					<Providers />
				</CardContent>
			</Card>
		</div>
	)
}
