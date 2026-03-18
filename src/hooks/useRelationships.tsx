import { useMemo } from 'react'

import {
	buildRelationshipsFromSchema,
	getTabConnectionId,
	tableNamesMatch,
} from '@/utils'
import { useActiveTab } from './useActiveTab'
import { useSchema } from './useSchema'

export const useRelationships = () => {
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab) ?? ''
	const database = activeTab?.database ?? ''
	const currentTable = activeTab?.table ?? ''
	const { schema, isLoading } = useSchema(connectionId, database)

	const relationships = useMemo(() => {
		if (!currentTable) return []

		return buildRelationshipsFromSchema(schema).filter(
			(rel) =>
				tableNamesMatch(rel.source_table, currentTable) ||
				tableNamesMatch(rel.target_table, currentTable),
		)
	}, [schema, currentTable])

	const hasRelationships = relationships.length > 0

	return { relationships, isLoading, hasRelationships }
}
