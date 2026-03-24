import Editor from '@monaco-editor/react'
import { useMemo } from 'react'

import {
	registerAppMonacoThemes,
	type AppMonacoTheme,
} from '@/lib/monaco-theme'
import { usePreferencesStore } from '@/stores'

interface JsonViewerProps {
	data: unknown
	theme: AppMonacoTheme
}

const stringifyJsonData = (data: unknown) => {
	try {
		return JSON.stringify(data, null, 2)
	} catch {
		return String(data)
	}
}

const JsonViewer = ({ data, theme }: JsonViewerProps) => {
	const fontSize = usePreferencesStore((state) => state.fontSize)

	const value = useMemo(() => stringifyJsonData(data), [data])

	return (
		<div className='h-full min-h-full w-full overflow-hidden rounded-lg border border-border bg-background'>
			<Editor
				key={`query-plan-json-${theme}`}
				height='100%'
				beforeMount={registerAppMonacoThemes}
				language='json'
				theme={theme}
				value={value}
				onMount={(editor) => {
					editor.layout()
				}}
				options={{
					readOnly: true,
					automaticLayout: true,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					wordWrap: 'off',
					fontSize,
					fontFamily: 'var(--app-mono-font-family)',
					fontLigatures: true,
					lineNumbers: 'on',
					folding: true,
					renderValidationDecorations: 'off',
					padding: { top: 16, bottom: 16 },
				}}
			/>
		</div>
	)
}

export default JsonViewer
