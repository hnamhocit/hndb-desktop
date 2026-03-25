import { autocompletion, completeAnyWord, snippetCompletion, type Completion, type CompletionContext, type CompletionSource } from '@codemirror/autocomplete'
import { MariaSQL, MSSQL, MySQL, PostgreSQL, SQLite, keywordCompletionSource, schemaCompletionSource, sql, type SQLConfig, type SQLDialect, type SQLNamespace } from '@codemirror/lang-sql'
import { type Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap } from '@codemirror/view'
import { githubLight, gruvboxDark, nord, okaidia, tokyoNight } from '@uiw/codemirror-themes-all'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { useEffect, useMemo, useRef } from 'react'

import { useActiveTab, useDatabases, useSchema } from '@/hooks'
import type { AppMonacoTheme } from '@/lib/monaco-theme'
import { useConnectionStore, usePreferencesStore, useTabsStore } from '@/stores'
import { getTabConnectionId } from '@/utils'

export type SqlEditorExecutionMode = 'smart' | 'all'

export type SqlEditorApi = {
	getExecutableQuery: (mode?: SqlEditorExecutionMode) => string
	focus: () => void
}

type SqlEditorProps = {
	onRunQuery?: () => void
	onRunAllQuery?: () => void
	onEditorReady?: (api: SqlEditorApi | null) => void
}

const DIALECT_BY_DRIVER: Record<string, SQLDialect> = {
	postgres: PostgreSQL,
	mysql: MySQL,
	mariadb: MariaSQL,
	mssql: MSSQL,
	sqlite: SQLite,
}

const CODEMIRROR_THEME_BY_APP_THEME: Record<AppMonacoTheme, Extension> = {
	'hndb-github-light': githubLight,
	'hndb-one-dark': oneDark,
	'hndb-tokyo-night': tokyoNight,
	'hndb-gruvbox-dark': gruvboxDark,
	'hndb-nord': nord,
	// Closest available bundled theme for now.
	'hndb-catppuccin-mocha': okaidia,
}

const SQLITE_UUID_DEFAULT_EXPRESSION =
	"(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))"

const getCurrentStatementContext = (sqlText: string, offset: number) => {
	const previousStatementBoundary = sqlText.lastIndexOf(
		';',
		Math.max(0, offset - 1),
	)
	const nextStatementBoundary = sqlText.indexOf(';', offset)
	const statementStart =
		previousStatementBoundary >= 0 ? previousStatementBoundary + 1 : 0
	const statementEnd =
		nextStatementBoundary >= 0 ? nextStatementBoundary : sqlText.length
	const statementText = sqlText.slice(statementStart, statementEnd)
	const cursorOffsetInStatement = Math.max(0, offset - statementStart)

	return {
		statementText,
		textBeforeCursor: statementText.slice(0, cursorOffsetInStatement),
	}
}

const isExpectingDatabaseName = (textBeforeCursor: string) =>
	/\b(?:CREATE|ALTER|DROP)\s+DATABASE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?[A-Za-z0-9_."`\[\]-]*$/i.test(
		textBeforeCursor,
	) || /\bUSE\s+[A-Za-z0-9_."`\[\]-]*$/i.test(textBeforeCursor)

const quoteIdentifierSnippet = (
	driver: string,
	placeholder: string,
) => {
	switch (driver) {
		case 'postgres':
			return `"${placeholder}"`
		case 'mysql':
		case 'mariadb':
			return `\`${placeholder}\``
		case 'mssql':
			return `[${placeholder}]`
		default:
			return placeholder
	}
}

const snippetPlaceholder = (index: number, label: string) =>
	`\${${index}:${label}}`

const buildSchemaNamespace = (schema: Record<string, string[]>): SQLNamespace =>
	Object.entries(schema).reduce<Record<string, readonly string[]>>(
		(accumulator, [tableName, columns]) => {
			accumulator[tableName] = columns
			return accumulator
		},
		{},
	)

const buildGenericSnippetCompletions = (driver: string): Completion[] => {
	const tableName = quoteIdentifierSnippet(driver, '${1:table_name}')
	const databaseName = quoteIdentifierSnippet(driver, '${1:database_name}')
	const nextDatabaseName = quoteIdentifierSnippet(
		driver,
		'${2:new_database_name}',
	)

	return [
		snippetCompletion(
			'SELECT *\nFROM ${1:table_name}\nWHERE ${2:condition};',
			{
				label: 'SELECT * FROM',
				type: 'keyword',
				detail: 'Snippet',
			},
		),
		snippetCompletion(
			'INSERT INTO ${1:table_name} (${2:column_name})\nVALUES (${3:value});',
			{
				label: 'INSERT INTO',
				type: 'keyword',
				detail: 'Snippet',
			},
		),
		snippetCompletion(
			'UPDATE ${1:table_name}\nSET ${2:column_name} = ${3:value}\nWHERE ${4:condition};',
			{
				label: 'UPDATE',
				type: 'keyword',
				detail: 'Snippet',
			},
		),
		snippetCompletion(`CREATE DATABASE ${databaseName};`, {
			label: 'CREATE DATABASE',
			type: 'keyword',
			detail: 'Database DDL',
		}),
		snippetCompletion(
			driver === 'mssql' ?
				`ALTER DATABASE ${databaseName}\nMODIFY NAME = ${nextDatabaseName};`
			:	`ALTER DATABASE ${databaseName}\nRENAME TO ${nextDatabaseName};`,
			{
				label: 'ALTER DATABASE',
				type: 'keyword',
				detail: 'Database DDL',
			},
		),
		snippetCompletion(`DROP DATABASE ${databaseName};`, {
			label: 'DROP DATABASE',
			type: 'keyword',
			detail: 'Database DDL',
		}),
		snippetCompletion(
			`CREATE TABLE ${tableName} (\n\t\${2:id} \${3:INTEGER} PRIMARY KEY,\n\t\${4:column_name} \${5:TEXT}\n);`,
			{
				label: 'CREATE TABLE',
				type: 'keyword',
				detail: 'DDL',
			},
		),
	]
}

const buildDriverSpecificSnippetCompletions = (
	driver: string,
): Completion[] => {
	const tableName = quoteIdentifierSnippet(driver, '${1:table_name}')
	const idColumn = snippetPlaceholder(1, 'id')
	const nameColumn = snippetPlaceholder(2, 'name')
	const textType = snippetPlaceholder(3, 'TEXT')
	const createdAtColumn = snippetPlaceholder(4, 'created_at')
	const createdAtType = snippetPlaceholder(5, 'TIMESTAMP')

	switch (driver) {
		case 'postgres':
			return [
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,`,
						`\t${nameColumn} ${textType} NOT NULL,`,
						`\t${createdAtColumn} ${createdAtType} DEFAULT NOW()`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE postgres identity PK',
						type: 'keyword',
						detail: 'PostgreSQL auto increment',
					},
				),
				snippetCompletion(
					[
						'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
						'',
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} UUID PRIMARY KEY DEFAULT gen_random_uuid(),`,
						`\t${nameColumn} ${textType} NOT NULL,`,
						`\t${createdAtColumn} ${createdAtType} DEFAULT NOW()`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE postgres uuid PK',
						type: 'keyword',
						detail: 'PostgreSQL UUID primary key',
					},
				),
			]
		case 'mysql':
		case 'mariadb': {
			const labelPrefix = driver === 'mysql' ? 'MySQL' : 'MariaDB'
			return [
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} BIGINT PRIMARY KEY AUTO_INCREMENT,`,
						`\t${nameColumn} VARCHAR(255) NOT NULL,`,
						`\t${createdAtColumn} DATETIME DEFAULT CURRENT_TIMESTAMP`,
						');',
					].join('\n'),
					{
						label: `CREATE TABLE ${driver} auto increment PK`,
						type: 'keyword',
						detail: `${labelPrefix} auto increment`,
					},
				),
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} CHAR(36) PRIMARY KEY DEFAULT (UUID()),`,
						`\t${nameColumn} VARCHAR(255) NOT NULL,`,
						`\t${createdAtColumn} DATETIME DEFAULT CURRENT_TIMESTAMP`,
						');',
					].join('\n'),
					{
						label: `CREATE TABLE ${driver} uuid PK`,
						type: 'keyword',
						detail: `${labelPrefix} UUID primary key`,
					},
				),
			]
		}
		case 'mssql':
			return [
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} BIGINT IDENTITY(1,1) PRIMARY KEY,`,
						`\t${nameColumn} NVARCHAR(255) NOT NULL,`,
						`\t${createdAtColumn} DATETIME2 DEFAULT GETDATE()`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE mssql identity PK',
						type: 'keyword',
						detail: 'MSSQL identity primary key',
					},
				),
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),`,
						`\t${nameColumn} NVARCHAR(255) NOT NULL,`,
						`\t${createdAtColumn} DATETIME2 DEFAULT GETDATE()`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE mssql uuid PK',
						type: 'keyword',
						detail: 'MSSQL UUID primary key',
					},
				),
			]
		case 'sqlite':
			return [
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} INTEGER PRIMARY KEY AUTOINCREMENT,`,
						`\t${nameColumn} TEXT NOT NULL,`,
						`\t${createdAtColumn} TEXT DEFAULT CURRENT_TIMESTAMP`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE sqlite autoincrement PK',
						type: 'keyword',
						detail: 'SQLite auto increment',
					},
				),
				snippetCompletion(
					[
						`CREATE TABLE ${tableName} (`,
						`\t${idColumn} TEXT PRIMARY KEY DEFAULT ${SQLITE_UUID_DEFAULT_EXPRESSION},`,
						`\t${nameColumn} TEXT NOT NULL,`,
						`\t${createdAtColumn} TEXT DEFAULT CURRENT_TIMESTAMP`,
						');',
					].join('\n'),
					{
						label: 'CREATE TABLE sqlite uuid PK',
						type: 'keyword',
						detail: 'SQLite UUID-like primary key',
					},
				),
			]
		default:
			return []
	}
}

const createSnippetCompletionSource = (
	driver: string,
): CompletionSource => {
	const completions = [
		...buildGenericSnippetCompletions(driver),
		...buildDriverSpecificSnippetCompletions(driver),
	]

	return (context: CompletionContext) => {
		const word = context.matchBefore(/[\w ]*/)
		if (!word) {
			return null
		}

		if (word.from === word.to && !context.explicit) {
			return null
		}

		return {
			from: word.from,
			options: completions,
			validFor: /[\w ]*/,
		}
	}
}

const createDatabaseCompletionSource = (
	databases: string[],
): CompletionSource => {
	return (context: CompletionContext) => {
		if (databases.length === 0) {
			return null
		}

		const sqlText = context.state.doc.toString()
		const { textBeforeCursor } = getCurrentStatementContext(
			sqlText,
			context.pos,
		)
		if (!isExpectingDatabaseName(textBeforeCursor)) {
			return null
		}

		const word = context.matchBefore(/[A-Za-z0-9_."`\[\]-]*/)
		if (!word) {
			return null
		}

		if (word.from === word.to && !context.explicit) {
			return null
		}

		return {
			from: word.from,
			options: databases.map((database) => ({
				label: database,
				type: 'namespace',
				detail: 'Database',
			})),
			validFor: /[A-Za-z0-9_."`\[\]-]*/,
		}
	}
}

const getSelectedSql = (view: EditorView) => {
	const selection = view.state.selection.main
	if (selection.empty) {
		return ''
	}

	return view.state.sliceDoc(selection.from, selection.to).trim()
}

const getExecutableQueryFromView = (
	view: EditorView | undefined,
	mode: SqlEditorExecutionMode = 'smart',
) => {
	if (!view) {
		return ''
	}

	const sqlText = view.state.doc.toString()
	if (mode === 'all') {
		return sqlText.trim()
	}

	const selectedSql = getSelectedSql(view)
	if (selectedSql) {
		return selectedSql
	}

	const cursorOffset = view.state.selection.main.head
	const { statementText } = getCurrentStatementContext(sqlText, cursorOffset)
	return statementText.trim() || sqlText.trim()
}

export default function SqlEditor({
	onRunQuery,
	onRunAllQuery,
	onEditorReady,
}: SqlEditorProps) {
	const editorRef = useRef<ReactCodeMirrorRef | null>(null)
	const { commitContent, contentById } = useTabsStore()
	const fontSize = usePreferencesStore((state) => state.fontSize)
	const monacoTheme = usePreferencesStore((state) => state.monacoTheme)
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab) ?? ''
	const database = activeTab?.database ?? ''
	const connections = useConnectionStore((state) => state.connections)
	const connectionDriver =
		connections.find((connection) => connection.id === connectionId)?.config
			.driver ?? 'mysql'
	const { databases } = useDatabases(connectionId, { autoFetch: true })
	const { schema } = useSchema(connectionId, database)

	const value =
		(activeTab && contentById[activeTab.id]) ??
		(activeTab?.type === 'query' ? '' : undefined)

	const derivedSchema = useMemo(
		() =>
			Object.entries(schema).reduce(
				(accumulator, [tableName, columns]) => {
					accumulator[tableName] = columns.map((column) => column.column_name)
					return accumulator
				},
				{} as Record<string, string[]>,
			),
		[schema],
	)

	const dialect = useMemo(
		() => DIALECT_BY_DRIVER[connectionDriver] ?? MySQL,
		[connectionDriver],
	)

	const schemaNamespace = useMemo(
		() => buildSchemaNamespace(derivedSchema),
		[derivedSchema],
	)

	const codeMirrorTheme = useMemo(
		() =>
			CODEMIRROR_THEME_BY_APP_THEME[monacoTheme] ??
			CODEMIRROR_THEME_BY_APP_THEME['hndb-one-dark'],
		[monacoTheme],
	)

	const sqlExtensions = useMemo(() => {
		const sqlConfig: SQLConfig = {
			dialect,
			upperCaseKeywords: true,
		}

		const editorTheme = EditorView.theme({
			'&': {
				height: '100%',
				fontSize: `${fontSize}px`,
			},
			'.cm-scroller': {
				fontFamily: 'var(--app-mono-font-family)',
				overflow: 'auto',
			},
			'.cm-content': {
				fontFamily: 'var(--app-mono-font-family)',
				paddingTop: '16px',
				paddingBottom: '16px',
			},
			'.cm-line': {
				paddingLeft: '12px',
				paddingRight: '12px',
			},
			'.cm-gutters': {
				borderRight: '1px solid hsl(var(--border) / 0.7)',
				backgroundColor: 'transparent',
				fontFamily: 'var(--app-mono-font-family)',
			},
			'.cm-activeLineGutter': {
				backgroundColor: 'transparent',
			},
			'.cm-activeLine': {
				backgroundColor: 'hsl(var(--muted) / 0.3)',
			},
			'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
				backgroundColor: 'hsl(var(--accent) / 0.35)',
			},
			'.cm-tooltip-autocomplete': {
				border: '1px solid hsl(var(--border))',
				borderRadius: '12px',
				overflow: 'hidden',
			},
		})

		return [
			EditorView.lineWrapping,
			editorTheme,
			sql(sqlConfig),
			keymap.of([
				{
					key: 'Mod-Enter',
					run: () => {
						onRunQuery?.()
						return true
					},
				},
				{
					key: 'Mod-Shift-Enter',
					run: () => {
						onRunAllQuery?.()
						return true
					},
				},
			]),
			autocompletion({
				override: [
					createSnippetCompletionSource(connectionDriver),
					createDatabaseCompletionSource(databases),
					schemaCompletionSource({
						dialect,
						schema: schemaNamespace,
					}),
					keywordCompletionSource(dialect, true),
					completeAnyWord,
				],
				activateOnTyping: true,
				maxRenderedOptions: 200,
				defaultKeymap: true,
				filterStrict: false,
			}),
		] satisfies Extension[]
	}, [
		connectionDriver,
		databases,
		dialect,
		fontSize,
		onRunAllQuery,
		onRunQuery,
		schemaNamespace,
	])

	useEffect(() => {
		onEditorReady?.({
			getExecutableQuery: (mode = 'smart') =>
				getExecutableQueryFromView(editorRef.current?.view, mode),
			focus: () => {
				editorRef.current?.view?.focus()
			},
		})

		return () => {
			onEditorReady?.(null)
		}
	}, [onEditorReady])

	if (!activeTab) {
		return null
	}

	return (
		<div className='min-h-0 flex-1 border-b'>
			<CodeMirror
				ref={editorRef}
				value={value}
				height='100%'
				theme={codeMirrorTheme}
				basicSetup={{
					autocompletion: false,
					foldGutter: false,
					dropCursor: false,
					allowMultipleSelections: false,
					highlightSelectionMatches: true,
					lineNumbers: true,
					tabSize: 2,
				}}
				indentWithTab
				extensions={sqlExtensions}
				onCreateEditor={(view) => {
					editorRef.current = { ...(editorRef.current ?? {}), view }
					view.focus()
				}}
				onChange={(nextValue) => {
					commitContent(activeTab.id, nextValue)
				}}
				className='h-full'
			/>
		</div>
	)
}
