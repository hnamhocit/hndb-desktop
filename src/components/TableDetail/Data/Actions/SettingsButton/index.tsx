import { SettingsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

const SettingsButton = () => {
	const { t } = useI18n()

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size='icon'
					variant='ghost'>
					<SettingsIcon />
				</Button>
			</TooltipTrigger>

			<TooltipContent>
				<p>{t('table.actions.moreSoon')}</p>
			</TooltipContent>
		</Tooltip>
	)
}

export default SettingsButton
