import type { WorkflowDefinition } from "#src/api/approval-workflow/types";
import { NodeType } from "#src/api/approval-workflow/types";
import { emptyDefinition, FLOW_EDGE_TYPE, hasCompleteLayout, toDefinition, toFlow } from "#src/pages/approval/workflow-designer/lib/to-definition";
import { validateGraph } from "#src/pages/approval/workflow-designer/lib/validate-graph";
import { describe, expect, it } from "vitest";
import { leaveWorkflow } from "./fixtures";

/** Fixture có đủ layout + một số cạnh có id */
function laidOut(): WorkflowDefinition {
	const def = leaveWorkflow();
	def.nodes.forEach((n, i) => {
		def.layout[n.id] = { x: (i % 2) * 300, y: i * 120 };
	});
	def.edges[0] = { id: "e_start_n1", ...def.edges[0] };
	def.edges[2] = { id: "e_yes", ...def.edges[2] };
	return def;
}

describe("to-definition", () => {
	it("round-trips definition → flow → definition without losing anything", () => {
		const def = laidOut();
		const { nodes, edges } = toFlow(def);
		expect(toDefinition(nodes, edges)).toEqual(def);
	});

	it("keeps exact edge shape (no extra id / undefined keys)", () => {
		const def = laidOut();
		const { nodes, edges } = toFlow(def);
		const out = toDefinition(nodes, edges);
		// Cạnh gốc không có id → không sinh id
		expect(Object.keys(out.edges[1])).toEqual(["from", "to"]);
		expect(out.edges[0]).toStrictEqual({ id: "e_start_n1", from: "start", to: "n1" });
		expect(out.edges[2]).toStrictEqual({ id: "e_yes", from: "c1", to: "n2", label: "Có", condition: { ">": [{ var: "payload.days" }, 3] } });
		expect(out.edges[3]).toStrictEqual({ from: "c1", to: "notify1", label: "Không", default: true });
	});

	it("maps nodes and edges to React Flow shapes", () => {
		const def = laidOut();
		const { nodes, edges } = toFlow(def);
		expect(nodes.find(n => n.id === "c1")).toMatchObject({ type: NodeType.Condition, position: def.layout.c1 });
		expect(edges.map(e => e.id)).toEqual(["e_start_n1", "n1->c1", "e_yes", "c1->notify1", "n2->notify1", "notify1->p1", "p1->end"]);
		expect(edges.every(e => e.type === FLOW_EDGE_TYPE)).toBe(true);
		expect(edges[3].data).toMatchObject({ default: true, label: "Không", hadId: false });
	});

	it("takes layout from node positions", () => {
		const { nodes, edges } = toFlow(laidOut());
		nodes[1] = { ...nodes[1], position: { x: 12.4, y: 99.6 } };
		expect(toDefinition(nodes, edges).layout.n1).toEqual({ x: 12, y: 100 });
	});

	it("keeps the old id when an id-less edge is rewired", () => {
		const { nodes, edges } = toFlow(laidOut());
		const rewired = edges.map(e => (e.id === "n1->c1" ? { ...e, target: "n2" } : e));
		expect(toDefinition(nodes, rewired).edges[1]).toEqual({ id: "n1->c1", from: "n1", to: "n2" });
	});

	it("detects missing layout and builds a valid empty definition", () => {
		expect(hasCompleteLayout(leaveWorkflow())).toBe(false);
		expect(hasCompleteLayout(laidOut())).toBe(true);
		expect(validateGraph(emptyDefinition())).toEqual([]);
	});
});
