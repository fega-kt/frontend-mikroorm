import type { GraphError } from "#src/api/approval-workflow/types";

/** Gom lỗi theo node / cạnh (lỗi chỉ có edgeId cũng gắn vào node nguồn của cạnh) */
export function groupErrors(errors: GraphError[], edges: { id: string, source: string }[], translate: (e: GraphError) => string) {
	const nodeErrors: Record<string, string[]> = {};
	const edgeErrors: Record<string, string[]> = {};
	const push = (map: Record<string, string[]>, key: string, msg: string) => {
		const list = (map[key] ??= []);
		if (!list.includes(msg))
			list.push(msg);
	};
	for (const err of errors) {
		const msg = translate(err);
		if (err.edgeId)
			push(edgeErrors, err.edgeId, msg);
		const nodeId = err.nodeId ?? (err.edgeId ? edges.find(e => e.id === err.edgeId)?.source : undefined);
		if (nodeId)
			push(nodeErrors, nodeId, msg);
	}
	return { nodeErrors, edgeErrors };
}
