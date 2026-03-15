import { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = 'LR',
) => {
	// LR = Left to Right (Trái sang Phải)
	dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 200 })

	nodes.forEach((node) => {
		// Tự động tính chiều cao thẻ: Header (45px) + (Số cột * 36px) + Padding (16px)
		const estimatedHeight =
			45 + (node.data.columns as unknown[]).length * 36 + 16
		dagreGraph.setNode(node.id, { width: 280, height: estimatedHeight })
	})

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target)
	})

	dagre.layout(dagreGraph)

	nodes.forEach((node) => {
		const nodeWithPosition = dagreGraph.node(node.id)
		node.position = {
			x: nodeWithPosition.x - 280 / 2,
			y: nodeWithPosition.y - nodeWithPosition.height / 2,
		}
		return node
	})

	return { nodes, edges }
}
