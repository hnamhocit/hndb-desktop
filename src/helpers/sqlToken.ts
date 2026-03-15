export type SqlToken =
	| { kind: 'identifier'; value: string }
	| { kind: 'literal'; value: unknown }
	| { kind: 'raw'; value: string }

const id = (value: string): SqlToken => ({
	kind: 'identifier',
	value,
})

const lit = (value: unknown): SqlToken => ({
	kind: 'literal',
	value,
})

const raw = (value: string): SqlToken => ({
	kind: 'raw',
	value,
})

export { id, lit, raw }
