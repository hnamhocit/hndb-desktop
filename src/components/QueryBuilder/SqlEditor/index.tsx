import { sql } from '@codemirror/lang-sql'
import * as themes from '@uiw/codemirror-themes-all'
import CodeMirror from '@uiw/react-codemirror'

import { useActiveTab, useSchema } from '@/hooks'
import { useTabsStore } from '@/stores'

export default function SqlEditor() {
	const { commitContent, contentById } = useTabsStore()
	const activeTab = useActiveTab()
	const { schema } = useSchema(activeTab!.dataSourceId!, activeTab!.database!)

	const value = contentById[activeTab!.id]

	const derivedSchema = Object.entries(schema).reduce(
		(acc, [table, columns]) => {
			acc[table] = columns.map((col) => col.column_name)
			return acc
		},
		{} as Record<string, string[]>,
	)

	return (
		<CodeMirror
			value={value}
			className='text-base sm:text-lg md:text-xl max-h-96 sm:max-h-120 overflow-y-auto'
			theme={themes.tokyoNight}
			extensions={[
				sql({ schema: derivedSchema, upperCaseKeywords: true }),
			]}
			onChange={(value) => {
				commitContent(activeTab!.id, value)
			}}
		/>
	)
}
