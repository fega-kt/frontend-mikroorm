import type { ApprovalRequestDetail } from "#src/api/approval-request/types";
import { ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";

export type NodeProgress = "done" | "current" | "rejected" | "returned" | "skipped" | "pending";

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
	if (detail.status === ApprovalRequestStatus.Pending) {
		for (const id of detail.currentNodeIds)
			status[id] = "current";
	}
	return status;
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
