import { translate } from '@/i18n/messages'
import type { TranslationKey } from '@/i18n/messages'
import { usePreferencesStore } from '@/stores'

type TranslationParams = Record<string, string | number>

export const useI18n = () => {
	const language = usePreferencesStore((state) => state.language)

	const t = (key: TranslationKey, params?: TranslationParams): string =>
		translate(language, key, params)

	return { t, language }
}
