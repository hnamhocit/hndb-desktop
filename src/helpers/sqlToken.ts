export type SqlToken = { kind: 'identifier'; value: string }

const id = (value: string): SqlToken => ({
	kind: 'identifier',
	value,
})

export { id }
