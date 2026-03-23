import { RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface RefreshButtonProps {
	onClick: () => Promise<void>
}

const RefreshButton = ({ onClick }: RefreshButtonProps) => {
	const { t } = useI18n()

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					onClick={onClick}
					size='icon'
					variant='ghost'>
					<RotateCcwIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{t('table.actions.refreshData')}</p>
			</TooltipContent>
		</Tooltip>
	)
}

export default RefreshButton
