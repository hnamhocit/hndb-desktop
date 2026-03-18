import { AxiosError } from 'axios'
import { toast } from 'sonner'

const MESSAGE_MAX_LENGTH = 220

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const extractString = (value: unknown): string | null => {
	if (typeof value !== 'string') return null

	const normalized = value
		.replace(/\s+/g, ' ')
		.replace(/^Error:\s*/i, '')
		.replace(
			/([a-z]+:\/\/[^:\s]+:)([^@\s]+)(@)/gi,
			(_, prefix: string, _secret: string, suffix: string) =>
				`${prefix}***${suffix}`,
		)
		.trim()

	if (!normalized || normalized === '[object Object]') {
		return null
	}

	if (normalized.length <= MESSAGE_MAX_LENGTH) {
		return normalized
	}

	return `${normalized.slice(0, MESSAGE_MAX_LENGTH - 3).trimEnd()}...`
}

const extractMessageFromRecord = (
	value: Record<string, unknown>,
): string | null => {
	for (const key of ['error', 'message', 'details', 'detail', 'cause']) {
		const directValue = value[key]
		const message = extractString(directValue)
		if (message) return message

		if (isRecord(directValue)) {
			const nestedMessage = extractMessageFromRecord(directValue)
			if (nestedMessage) return nestedMessage
		}
	}

	return null
}

const extractErrorMessage = (error: unknown): string | null => {
	if (error instanceof AxiosError) {
		const responseData = error.response?.data

		const responseMessage = extractString(responseData)
		if (responseMessage) return responseMessage

		if (isRecord(responseData)) {
			const message = extractMessageFromRecord(responseData)
			if (message) return message
		}

		return extractString(error.message)
	}

	if (error instanceof Error) {
		return extractString(error.message)
	}

	if (typeof error === 'string') {
		return extractString(error)
	}

	if (isRecord(error)) {
		return extractMessageFromRecord(error)
	}

	return null
}

const humanizeDatabaseError = (message: string): string => {
	const normalized = message.toLowerCase()

	if (
		normalized.includes('connection refused') ||
		normalized.includes('econnrefused') ||
		normalized.includes('actively refused') ||
		normalized.includes('could not connect to server') ||
		normalized.includes("can't connect to mysql server") ||
		normalized.includes('os error 111') ||
		normalized.includes('os error 61') ||
		normalized.includes('no such file or directory')
	) {
		return `Cannot connect to the database server. It may not be started, or the host/port/socket is incorrect. Detail: ${message}`
	}

	if (
		normalized.includes('timed out') ||
		normalized.includes('timeout') ||
		normalized.includes('deadline has elapsed')
	) {
		return `The database server did not respond in time. Check network access, host/port, and whether the server is overloaded. Detail: ${message}`
	}

	if (
		normalized.includes('password authentication failed') ||
		normalized.includes('authentication failed') ||
		normalized.includes('access denied for user') ||
		normalized.includes('using password: yes')
	) {
		return `Database authentication failed. Check the username and password. Detail: ${message}`
	}

	if (
		normalized.includes('database does not exist') ||
		normalized.includes('unknown database')
	) {
		return `The target database was not found. Check the database name in the connection settings. Detail: ${message}`
	}

	if (
		normalized.includes('role does not exist') ||
		normalized.includes('user does not exist') ||
		normalized.includes('unknown user')
	) {
		return `The database user was not found. Check the username or role. Detail: ${message}`
	}

	if (
		normalized.includes('permission denied') ||
		normalized.includes('not enough privileges')
	) {
		return `The database user does not have permission to perform this action. Detail: ${message}`
	}

	return message
}

export const formatErrorMessage = (
	error: unknown,
	fallbackMessage: string,
) => {
	const extractedMessage = extractErrorMessage(error)
	if (!extractedMessage) return fallbackMessage

	return humanizeDatabaseError(extractedMessage)
}

export const notifyError = (error: unknown, fallbackMessage: string) => {
	const message = formatErrorMessage(error, fallbackMessage)
	toast.error(message, { position: 'top-center' })
	return message
}
