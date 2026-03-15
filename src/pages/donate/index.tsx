import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

const creatorProfile = {
	name: 'hnamhocit',
	role: 'Full-stack developer and open-source enthusiast',
	avatarUrl: 'https://hnamhocit.vercel.app/icon.svg',
	portfolioUrl: 'https://hnamhocit.vercel.app',
}

export default function DonatePage() {
	return (
		<div className='h-full overflow-auto p-4 md:p-6 lg:p-8'>
			<div className='mx-auto max-w-3xl space-y-4'>
				<Link
					to='/'
					className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
					<ArrowLeftIcon size={14} />
					Back
				</Link>

				<div className='rounded-xl border bg-linear-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5 md:p-6'>
					<p className='text-xs uppercase tracking-widest font-semibold text-primary'>
						Support Page
					</p>
					<h1 className='mt-2 text-2xl md:text-3xl font-bold tracking-tight'>
						Buy me a coffee
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Template page: update your avatar, name, portfolio link
						and QR image later.
					</p>
				</div>

				<div className='rounded-xl border p-5 md:p-6'>
					<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
						<img
							src={creatorProfile.avatarUrl}
							alt='Creator avatar'
							width={88}
							height={88}
							className='size-[88px] rounded-xl border object-cover'
						/>

						<div className='space-y-1'>
							<div className='text-xl font-semibold'>
								{creatorProfile.name}
							</div>
							<div className='text-sm text-muted-foreground'>
								{creatorProfile.role}
							</div>
							<Button
								asChild
								variant='outline'
								className='mt-2'>
								<a
									href={creatorProfile.portfolioUrl}
									target='_blank'
									rel='noreferrer'>
									Portfolio
									<ExternalLinkIcon />
								</a>
							</Button>
						</div>
					</div>
				</div>

				<div className='rounded-xl border p-5 md:p-6 space-y-3'>
					<div className='text-lg font-semibold'>QR Donation</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='overflow-hidden rounded-2xl border bg-muted/20'>
							<img
								src='/resources/qr-1.jpeg'
								alt='Donation QR 1'
								width={720}
								height={720}
								className='h-auto w-full object-cover'
							/>
						</div>

						<div className='overflow-hidden rounded-2xl border bg-muted/20'>
							<img
								src='/resources/qr-2.jpeg'
								alt='Donation QR 2'
								width={720}
								height={720}
								className='h-auto w-full object-cover'
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
