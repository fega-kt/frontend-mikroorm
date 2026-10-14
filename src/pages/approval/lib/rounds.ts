import type { ApprovalHistoryItem, ApprovalRequestDetail, ApprovalTaskItem, UserBrief } from "#src/api/approval-request/types";
import type { NodeProgress } from "./progress";
import { ApprovalHistoryAction, ApprovalRequestStatus } from "#src/api/approval-request/types";
import { NodeType } from "#src/api/approval-workflow/types";
import { computeNodeStatus } from "./progress";

/** Sự kiện khép một vòng → kết quả của vòng đó */
const END_OUTCOME: Partial<Record<ApprovalHistoryAction, ApprovalRequestStatus>> = {
	[ApprovalHistoryAction.Return]: ApprovalRequestStatus.Returned,
	[ApprovalHistoryAction.Reject]: ApprovalRequestStatus.Rejected,
	[ApprovalHistoryAction.Cancel]: ApprovalRequestStatus.Cancelled,
	[ApprovalHistoryAction.Complete]: ApprovalRequestStatus.Approved,
};

/** Một vòng trình duyệt: từ lúc gửi (hoặc gửi lại) tới khi bị trả lại / từ chối / hủy / duyệt xong */
export interface ApprovalRound {
	round: number
	submittedAt?: string
	submittedBy: UserBrief | null
	/** Sự kiện khép vòng; chưa có = vòng đang chạy */
	end?: ApprovalHistoryItem
	/** Kết quả vòng — Pending khi vòng còn đang duyệt */
	outcome: ApprovalRequestStatus
	tasks: ApprovalTaskItem[]
	/** Lịch sử thuộc vòng (từ dòng gửi tới trước lần gửi kế tiếp) */
	histories: ApprovalHistoryItem[]
	nodeStatus: Record<string, NodeProgress>
	visitedNodeIds: string[]
}

/** Lịch sử theo bước nhưng không có task (bước bị bỏ qua, bước thông báo) */
const STEP_EVENTS = [ApprovalHistoryAction.Skip, ApprovalHistoryAction.Notify];

/** Task + lịch sử của một bước trong vòng */
export interface StepGroup {
	nodeId: string
	name: string
	at: string
	tasks: ApprovalTaskItem[]
	events: ApprovalHistoryItem[]
}

/** Gom task + lịch sử của vòng theo bước, sắp theo thời điểm đơn tới bước */
export function groupSteps(round: ApprovalRound): StepGroup[] {
	const groups = new Map<string, StepGroup>();
	const touch = (nodeId: string, name: string | undefined, at: string) => {
		const group = groups.get(nodeId) ?? { nodeId, name: name ?? nodeId, at, tasks: [], events: [] };
		if (at < group.at)
			group.at = at;
		if (name && group.name === nodeId)
			group.name = name;
		groups.set(nodeId, group);
		return group;
	};
	for (const task of round.tasks)
		touch(task.nodeId, task.nodeName, task.createdAt).tasks.push(task);
	for (const item of round.histories) {
		if (item.nodeId && STEP_EVENTS.includes(item.action))
			touch(item.nodeId, item.nodeName, item.createdAt).events.push(item);
	}
	return [...groups.values()].sort((a, b) => a.at.localeCompare(b.at));
}

type RoundSource = Pick<ApprovalRequestDetail, "tasks" | "histories" | "round" | "visitedNodeIds" | "currentNodeIds" | "status" | "definition" | "submittedAt" | "requester">;

/**
 * Chia tờ trình thành các vòng theo dòng gửi / gửi lại trong lịch sử.
 * Backend chỉ giữ đường đi của vòng hiện tại (visitedNodeIds reset mỗi lần gửi) nên vòng cũ dựng lại từ task + lịch sử.
 */
export function buildRounds(detail: RoundSource): ApprovalRound[] {
	if (!detail.round)
		return [];
	const starts = detail.histories
		.map((item, index) => (item.action === ApprovalHistoryAction.Submit || item.action === ApprovalHistoryAction.Resubmit ? index : -1))
		.filter(index => index >= 0);
	const startNodeId = detail.definition?.nodes.find(node => node.type === NodeType.Start)?.id;

	// Dữ liệu cũ thiếu dòng gửi: chỉ dựng được vòng hiện tại
	if (!starts.length) {
		return [{
			round: detail.round,
			submittedAt: detail.submittedAt,
			submittedBy: detail.requester,
			outcome: detail.status,
			tasks: detail.tasks.filter(task => task.round === detail.round),
			histories: detail.histories,
			nodeStatus: computeNodeStatus(detail),
			visitedNodeIds: detail.visitedNodeIds,
		}];
	}

	return starts.map((start, index) => {
		const isCurrent = index === starts.length - 1;
		// Đánh số theo vòng hiện tại để khớp task.round kể cả khi lịch sử thiếu dòng
		const round = detail.round - (starts.length - 1 - index);
		const histories = detail.histories.slice(start, starts[index + 1] ?? detail.histories.length);
		// Vòng khép ở sự kiện kết thúc đầu tiên (vd: trả lại rồi hủy → vòng đó là "trả lại")
		const end = histories.find(item => END_OUTCOME[item.action]);
		const outcome = end ? END_OUTCOME[end.action]! : ApprovalRequestStatus.Pending;
		const tasks = detail.tasks.filter(task => task.round === round);

		if (isCurrent) {
			return {
				round,
				submittedAt: histories[0].createdAt,
				submittedBy: histories[0].actor,
				end,
				outcome,
				tasks,
				histories,
				nodeStatus: computeNodeStatus(detail),
				visitedNodeIds: detail.visitedNodeIds,
			};
		}

		const visitedNodeIds = [...new Set([
			...(startNodeId ? [startNodeId] : []),
			...histories.flatMap(item => (item.nodeId ? [item.nodeId] : [])),
			...tasks.map(task => task.nodeId),
		])];
		return {
			round,
			submittedAt: histories[0].createdAt,
			submittedBy: histories[0].actor,
			end,
			outcome,
			tasks,
			histories,
			nodeStatus: computeNodeStatus({ tasks, round, visitedNodeIds, currentNodeIds: [], status: outcome }),
			visitedNodeIds,
		};
	});
}
