import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditor, Position } from 'monaco-editor'
import { useEffect, useMemo, useRef } from 'react'

import { useActiveTab, useSchema } from '@/hooks'
import { registerAppMonacoThemes } from '@/lib/monaco-theme'
import { usePreferencesStore, useTabsStore } from '@/stores'
import { getTabConnectionId } from '@/utils'

const SQL_KEYWORDS = [
	'SELECT',
	'FROM',
	'WHERE',
	'JOIN',
	'LEFT JOIN',
	'RIGHT JOIN',
	'INNER JOIN',
	'GROUP BY',
	'ORDER BY',
	'LIMIT',
	'OFFSET',
	'INSERT INTO',
	'VALUES',
	'UPDATE',
	'SET',
	'DELETE FROM',
	'CREATE TABLE',
	'ALTER TABLE',
	'DROP TABLE',
	'WITH',
	'UNION',
	'DISTINCT',
	'COUNT',
	'SUM',
	'AVG',
	'MIN',
	'MAX',
	'AND',
	'OR',
	'NOT',
	'NULL',
] as const

const SQL_ALIAS_STOP_WORDS = new Set([
	'ON',
	'USING',
	'WHERE',
	'GROUP',
	'ORDER',
	'LIMIT',
	'OFFSET',
	'HAVING',
	'LEFT',
	'RIGHT',
	'INNER',
	'OUTER',
	'FULL',
	'JOIN',
	'UNION',
	'SET',
	'VALUES',
])

type TableContext = {
	tableName: string
	qualifier: string
}

const normalizeSqlIdentifier = (value: string) =>
	value
		.trim()
		.replace(/^[`"'\[]+/, '')
		.replace(/[`"'\]]+$/, '')

const resolveSchemaTableName = (
	rawTableName: string,
	schema: Record<string, string[]>,
) => {
	const normalizedTableName = normalizeSqlIdentifier(rawTableName)
	if (!normalizedTableName) return null

	if (schema[normalizedTableName]) {
		return normalizedTableName
	}

	const tableLeafName =
		normalizedTableName.split('.').map(normalizeSqlIdentifier).pop() ?? ''

	if (tableLeafName && schema[tableLeafName]) {
		return tableLeafName
	}

	return null
}

const parseTableContexts = (
	sql: string,
	schema: Record<string, string[]>,
): TableContext[] => {
	const contexts = new Map<string, TableContext>()
	const tablePattern =
		/\b(?:FROM|JOIN|UPDATE|INTO)\s+([A-Za-z0-9_."`\[\]]+)(?:\s+(?:AS\s+)?([A-Za-z0-9_."`\[\]]+))?/gi

	for (const match of sql.matchAll(tablePattern)) {
		const rawTableName = match[1]
		const rawAlias = match[2]
		const tableName = resolveSchemaTableName(rawTableName, schema)

		if (!tableName) continue

		const normalizedAlias = rawAlias ? normalizeSqlIdentifier(rawAlias) : ''
		const alias =
			normalizedAlias &&
			!SQL_ALIAS_STOP_WORDS.has(normalizedAlias.toUpperCase()) ?
				normalizedAlias
			:	null

		const qualifier = alias || tableName

		contexts.set(qualifier, {
			tableName,
			qualifier,
		})
	}

	return Array.from(contexts.values())
}

const getCurrentStatementContext = (sql: string, offset: number) => {
	const previousStatementBoundary = sql.lastIndexOf(';', Math.max(0, offset - 1))
	const nextStatementBoundary = sql.indexOf(';', offset)
	const statementStart = previousStatementBoundary >= 0 ? previousStatementBoundary + 1 : 0
	const statementEnd =
		nextStatementBoundary >= 0 ? nextStatementBoundary : sql.length
	const statementText = sql.slice(statementStart, statementEnd)
	const cursorOffsetInStatement = Math.max(0, offset - statementStart)
	const textBeforeCursor = statementText.slice(0, cursorOffsetInStatement)

	return {
		statementText,
		textBeforeCursor,
	}
}

const getQualifierBeforeCursor = (textBeforeCursor: string) => {
	const qualifierMatch = textBeforeCursor.match(/([A-Za-z_][\w$]*)\.\w*$/)
	return qualifierMatch?.[1] ?? null
}

const isExpectingTableName = (textBeforeCursor: string) =>
	/\b(?:FROM|JOIN|UPDATE|INTO)\s+[A-Za-z0-9_."`\[\]]*$/i.test(textBeforeCursor)

export default function SqlEditor() {
	const { commitContent, contentById } = useTabsStore()
	const fontSize = usePreferencesStore((state) => state.fontSize)
	const monacoTheme = usePreferencesStore((state) => state.monacoTheme)
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab) ?? ''
	const database = activeTab?.database ?? ''
	const { schema } = useSchema(connectionId, database)
	const completionDisposableRef = useRef<{ dispose: () => void } | null>(null)
	const schemaRef = useRef<Record<string, string[]>>({})

	const value =
		(activeTab && contentById[activeTab.id]) ??
		(activeTab?.type === 'query' ? '' : undefined)

	const derivedSchema = useMemo(
		() =>
			Object.entries(schema).reduce(
				(acc, [table, columns]) => {
					acc[table] = columns.map((col) => col.column_name)
					return acc
				},
				{} as Record<string, string[]>,
			),
		[schema],
	)

	useEffect(() => {
		schemaRef.current = derivedSchema
	}, [derivedSchema])

	useEffect(() => {
		return () => {
			completionDisposableRef.current?.dispose()
			completionDisposableRef.current = null
		}
	}, [])

	if (!activeTab) {
		return null
	}

	const registerCompletionProvider = (monaco: Monaco) => {
		completionDisposableRef.current?.dispose()
		completionDisposableRef.current = monaco.languages.registerCompletionItemProvider(
				'sql',
				{
					provideCompletionItems(
						model: MonacoEditor.ITextModel,
						position: Position,
					) {
					const word = model.getWordUntilPosition(position)
					const fullText = model.getValue()
					const cursorOffset = model.getOffsetAt(position)
					const { statementText, textBeforeCursor } =
						getCurrentStatementContext(fullText, cursorOffset)
					const activeTableContexts = parseTableContexts(
						statementText,
						schemaRef.current,
					)
					const qualifierBeforeCursor = getQualifierBeforeCursor(
						textBeforeCursor,
					)
					const isTypingTableName = isExpectingTableName(textBeforeCursor)
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: word.startColumn,
						endColumn: word.endColumn,
					}

					const keywordSuggestions = SQL_KEYWORDS.map((keyword) => ({
						label: keyword,
						kind: monaco.languages.CompletionItemKind.Keyword,
						insertText: keyword,
						range,
					}))

					const tableSuggestions = Object.keys(schemaRef.current).map(
						(tableName) => ({
							label: tableName,
							kind: monaco.languages.CompletionItemKind.Class,
							insertText: tableName,
							range,
							detail: 'Table',
						}),
					)

					const scopedTableContexts =
						qualifierBeforeCursor ?
							activeTableContexts.filter(
								(tableContext) =>
									tableContext.qualifier === qualifierBeforeCursor ||
									tableContext.tableName === qualifierBeforeCursor,
							)
						: activeTableContexts.length > 0 ?
							activeTableContexts
						: Object.keys(schemaRef.current).map((tableName) => ({
								tableName,
								qualifier: tableName,
							}))

					const shouldQualifyColumns =
						!qualifierBeforeCursor && scopedTableContexts.length > 1

					const columnSuggestions = scopedTableContexts.flatMap(
						({ tableName, qualifier }) =>
							(schemaRef.current[tableName] ?? []).map((columnName) => ({
								label:
									qualifierBeforeCursor || !shouldQualifyColumns ?
										columnName
									:	`${qualifier}.${columnName}`,
								kind: monaco.languages.CompletionItemKind.Field,
								insertText:
									qualifierBeforeCursor || !shouldQualifyColumns ?
										columnName
									:	`${qualifier}.${columnName}`,
								range,
								detail: tableName,
							})),
					)

					const snippetSuggestions = [
						{
							label: 'SELECT * FROM',
							kind: monaco.languages.CompletionItemKind.Snippet,
							insertText: 'SELECT *\nFROM ${1:table_name}\nWHERE ${2:condition};',
							insertTextRules:
								monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							range,
							detail: 'Snippet',
						},
						{
							label: 'INSERT INTO',
							kind: monaco.languages.CompletionItemKind.Snippet,
							insertText:
								'INSERT INTO ${1:table_name} (${2:column_name})\nVALUES (${3:value});',
							insertTextRules:
								monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							range,
							detail: 'Snippet',
						},
						{
							label: 'UPDATE',
							kind: monaco.languages.CompletionItemKind.Snippet,
							insertText:
								'UPDATE ${1:table_name}\nSET ${2:column_name} = ${3:value}\nWHERE ${4:condition};',
							insertTextRules:
								monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							range,
							detail: 'Snippet',
						},
					]

					return {
						suggestions: [
							...snippetSuggestions,
							...keywordSuggestions,
							...(isTypingTableName ? tableSuggestions : []),
							...columnSuggestions,
							...(!isTypingTableName ? tableSuggestions : []),
						],
					}
				},
			},
		)
	}

	const handleMount: OnMount = (editor, monaco) => {
		registerAppMonacoThemes(monaco)
		registerCompletionProvider(monaco)

		editor.focus()
	}

	return (
		<div className='min-h-0 flex-1 border-b'>
			<Editor
				height='100%'
				path={`query://${activeTab.id}.sql`}
				defaultLanguage='sql'
				language='sql'
				beforeMount={registerAppMonacoThemes}
				theme={monacoTheme}
				value={value}
				onMount={handleMount}
				onChange={(nextValue) => {
					commitContent(activeTab.id, nextValue ?? '')
				}}
				options={{
					automaticLayout: true,
					minimap: { enabled: false },
					fontSize,
					fontFamily: 'var(--app-mono-font-family)',
					fontLigatures: true,
					wordWrap: 'on',
					scrollBeyondLastLine: false,
					smoothScrolling: true,
					cursorBlinking: 'smooth',
					contextmenu: true,
					acceptSuggestionOnEnter: 'on',
					bracketPairColorization: { enabled: true },
					padding: { top: 16, bottom: 16 },
					suggest: {
						showWords: false,
						preview: true,
						previewMode: 'prefix',
					},
					quickSuggestions: {
						other: true,
						comments: false,
						strings: false,
					},
				}}
			/>
		</div>
	)
}
