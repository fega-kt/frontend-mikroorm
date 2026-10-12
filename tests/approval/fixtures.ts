import type { WorkflowDefinition } from "#src/api/approval-workflow/types";
import { ApproverType, DEFAULT_STEP_OPTIONS, NodeType, NotifyChannel, OverdueAction, ParallelMode } from "#src/api/approval-workflow/types";

/** Cùng quy trình với backend __fixtures__/leave-workflow.ts (đã điền giá trị mặc định) */
export function leaveWorkflow(): WorkflowDefinition {
	return {
		nodes: [
			{ id: "start", type: NodeType.Start },
			{
				id: "n1",
				type: NodeType.Approval,
				name: "Trưởng phòng",
				approver: { type: ApproverType.DeptHead },
				slaHours: 24,
				onOverdue: OverdueAction.Remind,
				options: { ...DEFAULT_STEP_OPTIONS },
			},
			{ id: "c1", type: NodeType.Condition, name: "Số ngày nghỉ > 3?" },
			{
				id: "n2",
				type: NodeType.Approval,
				name: "Giám đốc khối",
				approver: { type: ApproverType.SpecificUser, userId: "director" },
				slaHours: 48,
				onOverdue: OverdueAction.RemindThenEscalate,
				options: { ...DEFAULT_STEP_OPTIONS, skipIfRequester: true },
			},
			{ id: "notify1", type: NodeType.Notify, name: "Báo HR", channels: [NotifyChannel.Email], recipients: [] },
			{
				id: "p1",
				type: NodeType.Parallel,
				mode: ParallelMode.All,
				approvers: [
					{ type: ApproverType.SpecificUser, userId: "hr" },
					{ type: ApproverType.SpecificUser, userId: "admin_office" },
				],
				slaHours: 24,
				onOverdue: OverdueAction.Remind,
				options: { ...DEFAULT_STEP_OPTIONS },
			},
			{ id: "end", type: NodeType.End },
		],
		edges: [
			{ from: "start", to: "n1" },
			{ from: "n1", to: "c1" },
			{ from: "c1", to: "n2", label: "Có", condition: { ">": [{ var: "payload.days" }, 3] } },
			{ from: "c1", to: "notify1", label: "Không", default: true },
			{ from: "n2", to: "notify1" },
			{ from: "notify1", to: "p1" },
			{ from: "p1", to: "end" },
		],
		layout: {},
	};
}
