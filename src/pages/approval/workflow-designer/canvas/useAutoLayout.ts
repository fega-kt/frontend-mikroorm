import type { FlowEdge, FlowNode } from "../lib/to-definition";
import dagre from "@dagrejs/dagre";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { NODE_WIDTH, nodeHeight } from "../lib/node-factory";

type Positions = Record<string, { x: number, y: number }>;

/** Bố cục dagre từ trên xuống — trả về vị trí góc trên-trái của từng node */
export function layoutGraph(nodes: Pick<FlowNode, "id" | "type">[], edges: Pick<FlowEdge, "source" | "target">[]): Positions {
	const g = new dagre.graphlib.Graph();
	g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 48, marginx: 20, marginy: 20 });
	g.setDefaultEdgeLabel(() => ({}));
	for (const n of nodes)
		g.setNode(n.id, { width: NODE_WIDTH, height: nodeHeight(n.type ?? "") });
	for (const e of edges) {
		if (g.hasNode(e.source) && g.hasNode(e.target))
			g.setEdge(e.source, e.target);
	}
	dagre.layout(g);

	const positions: Positions = {};
	for (const n of nodes) {
		const p = g.node(n.id) as { x: number, y: number } | undefined;
		if (p)
			positions[n.id] = { x: Math.round(p.x - NODE_WIDTH / 2), y: Math.round(p.y - nodeHeight(n.type ?? "") / 2) };
	}
	return positions;
}

/** Áp dụng bố cục tự động cho đồ thị rồi căn khung nhìn */
export function useAutoLayout(getGraph: () => { nodes: FlowNode[], edges: FlowEdge[] }, apply: (positions: Positions) => void) {
	const { fitView } = useReactFlow();
	return useCallback(() => {
		const { nodes, edges } = getGraph();
		apply(layoutGraph(nodes, edges));
		requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300, maxZoom: 1 }));
	}, [getGraph, apply, fitView]);
}
