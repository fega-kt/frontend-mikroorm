import type { Approver, WorkflowEdge, WorkflowNode } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { TFunction } from "i18next";
import type { ConditionInfo } from "./display-context";
import { ApproverType, NodeType, notifiesRequester } from "#src/api/approval-workflow/types";
import { summarizeCondition } from "../lib/condition";
import { collectPayloadVars } from "../lib/validate-graph";

/** Nhãn người duyệt: "Trưởng phòng", "Phó phòng" hoặc tên người dùng / nhóm */
export function approverLabel(approver: Approver | null | undefined, t: TFunction, userNames: Record<string, string> = {}): string {
	if (!approver)
		return t("workflowDesigner.summary.noApprover");
	if (approver.type === ApproverType.SpecificUser) {
		return approver.userId
			? (userNames[approver.userId] ?? t("workflowDesigner.approverType.SPECIFIC_USER"))
			: t("workflowDesigner.summary.noApprover");
	}
	if (approver.type === ApproverType.Principal) {
		return approver.principalId
			? (userNames[approver.principalId] ?? t("workflowDesigner.approverType.PRINCIPAL"))
			: t("workflowDesigner.summary.noApprover");
	}
	return t(`workflowDesigner.approverType.${approver.type}`);
}

export function nodeTitle(node: WorkflowNode, t: TFunction) {
	return node.name?.trim() || t(`workflowDesigner.nodeTypes.${node.type}`);
}

export function edgeLabelText(
	data: Pick<WorkflowEdge, "label" | "condition" | "default"> | undefined,
	t: TFunction,
	fields: FormField[] = [],
): string {
	if (!data)
		return "";
	if (data.label)
		return data.label;
	if (data.default)
		return t("workflowDesigner.edge.default");
	if (data.condition) {
		return summarizeCondition(data.condition, {
			fields,
			and: t("workflowDesigner.summary.and"),
			or: t("workflowDesigner.summary.or"),
			yes: t("workflowDesigner.condition.true"),
			no: t("workflowDesigner.condition.false"),
		});
	}
	return "";
}

/** Tóm tắt một dòng của node */
export function nodeSummary(
	node: WorkflowNode,
	t: TFunction,
	ctx: { userNames: Record<string, string>, fields: FormField[], conditionInfo?: ConditionInfo },
): string {
	const sla = (hours?: number) => (hours ? ` · ${t("workflowDesigner.summary.sla", { hours })}` : "");
	switch (node.type) {
		case NodeType.Start:
			return t("workflowDesigner.summary.start");
		case NodeType.Approval:
			return `${approverLabel(node.approver, t, ctx.userNames)}${sla(node.slaHours)}`;
		case NodeType.Parallel: {
			const names = node.approvers.map(a => approverLabel(a, t, ctx.userNames));
			const who = names.length ? names.join(", ") : t("workflowDesigner.summary.noApprover");
			return `${t(`workflowDesigner.parallelMode.${node.mode}`)} · ${who}${sla(node.slaHours)}`;
		}
		case NodeType.Condition: {
			const info = ctx.conditionInfo;
			if (!info)
				return "";
			const labels = info.vars.map((v) => {
				const key = v.replace(/^payload\./, "");
				return ctx.fields.find(f => f.key === key)?.label ?? v;
			});
			const branches = t("workflowDesigner.summary.branches", { count: info.branches });
			return labels.length ? `${labels.join(", ")} · ${branches}` : branches;
		}
		case NodeType.Notify: {
			const channels = node.channels.length
				? node.channels.map(c => t(`workflowDesigner.channels.${c}`)).join(", ")
				: t("workflowDesigner.summary.noChannel");
			const to = [
				...(notifiesRequester(node) ? [t("workflowDesigner.summary.requester")] : []),
				...(node.notifyNextApprovers ? [t("workflowDesigner.summary.nextApprovers")] : []),
				...node.recipients.map(a => approverLabel(a, t, ctx.userNames)),
			].join(", ") || t("workflowDesigner.summary.noRecipient");
			return `${channels} → ${to}`;
		}
		default:
			return "";
	}
}

/** Thống kê nhánh của từng node điều kiện */
export function buildConditionInfo(edges: { source: string, data?: { condition?: unknown } }[]): Record<string, ConditionInfo> {
	const result: Record<string, ConditionInfo> = {};
	for (const e of edges) {
		const info = (result[e.source] ??= { branches: 0, vars: [] });
		info.branches += 1;
		if (e.data?.condition) {
			for (const v of collectPayloadVars(e.data.condition)) {
				if (!info.vars.includes(v))
					info.vars.push(v);
			}
		}
	}
	return result;
}
