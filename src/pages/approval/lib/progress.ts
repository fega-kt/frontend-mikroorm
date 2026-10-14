import type { ApprovalRequestDetail } from "#src/api/approval-request/types";
import type { WorkflowDefinition, WorkflowNode } from "#src/api/approval-workflow/types";
import { ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";
import { NodeType } from "#src/api/approval-workflow/types";

export type NodeProgress = "done" | "current" | "rejected" | "returned" | "skipped" | "cancelled" | "pending";

/** Trạng thái từng node của sơ đồ tiến trình, tính từ task của lượt hiện tại */
export function computeNodeStatus(detail: Pick<ApprovalRequestDetail, "tasks" | "round" | "visitedNodeIds" | "currentNodeIds" | "status">) {
	const status: Record<string, NodeProgress> = {};
	for (const id of detail.visitedNodeIds)
		status[id] = "done";

	const byNode = new Map<string, ApprovalTaskStatus[]>();
	for (const task of detail.tasks) {
		if (task.round !== detail.round)
			continue;
		byNode.set(task.nodeId, [...(byNode.get(task.nodeId) ?? []), task.status]);
	}
	for (const [nodeId, statuses] of byNode) {
		if (statuses.includes(ApprovalTaskStatus.Rejected))
			status[nodeId] = "rejected";
		else if (statuses.includes(ApprovalTaskStatus.Returned))
			status[nodeId] = "returned";
		else if (statuses.includes(ApprovalTaskStatus.Pending))
			status[nodeId] = "current";
		else if (statuses.every(s => s === ApprovalTaskStatus.Skipped))
			status[nodeId] = "skipped";
		else
			status[nodeId] = "done";
	}
	// Đơn đã hủy: task chưa xử lý bị hệ thống chuyển sang Skipped, hiển thị là "đã hủy" thay vì "bỏ qua"
	if (detail.status === ApprovalRequestStatus.Cancelled) {
		for (const [id, s] of Object.entries(status)) {
			if (s === "skipped")
				status[id] = "cancelled";
		}
	}
	if (detail.status === ApprovalRequestStatus.Pending) {
		for (const id of detail.currentNodeIds)
			status[id] = "current";
	}
	return status;
}

/** Các bước theo thứ tự đi từ node Bắt đầu; bỏ node điều kiện / song song vì chỉ là điểm rẽ nhánh */
export function orderNodes(definition: WorkflowDefinition): WorkflowNode[] {
	const byId = new Map(definition.nodes.map(node => [node.id, node]));
	const start = definition.nodes.find(node => node.type === NodeType.Start);
	if (!start)
		return definition.nodes;

	const seen = new Set<string>([start.id]);
	const queue = [start.id];
	const ordered: WorkflowNode[] = [];
	while (queue.length) {
		const node = byId.get(queue.shift()!);
		if (!node)
			continue;
		ordered.push(node);
		for (const edge of definition.edges) {
			if (edge.from === node.id && !seen.has(edge.to)) {
				seen.add(edge.to);
				queue.push(edge.to);
			}
		}
	}
	return ordered.filter(node => node.type !== NodeType.Condition && node.type !== NodeType.Parallel);
}

/** id → tên người duyệt (để sơ đồ hiển thị tên người cụ thể) */
export function collectUserNames(detail: Pick<ApprovalRequestDetail, "tasks">) {
	const names: Record<string, string> = {};
	for (const task of detail.tasks) {
		for (const user of [task.approver, task.originalApprover, task.actedBy]) {
			if (user)
				names[user.id] = user.fullName;
		}
	}
	return names;
}
