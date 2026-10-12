import type { Approver, WorkflowDefinition } from "#src/api/approval-workflow/types";
import { ApproverType, NodeType } from "#src/api/approval-workflow/types";
import { principalService } from "#src/api/system/principal";
import { userService } from "#src/api/user";
import { useEffect, useMemo, useState } from "react";

/** id người dùng (SPECIFIC_USER) và id principal (PRINCIPAL) xuất hiện trong định nghĩa quy trình */
export function collectApproverRefs(definition: WorkflowDefinition | null | undefined) {
	const userIds = new Set<string>();
	const principalIds = new Set<string>();
	const add = (a: Approver | null | undefined) => {
		if (a?.type === ApproverType.SpecificUser && a.userId)
			userIds.add(a.userId);
		if (a?.type === ApproverType.Principal && a.principalId)
			principalIds.add(a.principalId);
	};
	for (const node of definition?.nodes ?? []) {
		if (node.type === NodeType.Approval)
			add(node.approver);
		else if (node.type === NodeType.Parallel)
			node.approvers.forEach(add);
		else if (node.type === NodeType.Notify)
			node.recipients.forEach(add);
	}
	return { userIds: [...userIds], principalIds: [...principalIds] };
}

/** Lấy tên hiển thị cho các id còn thiếu trong `known` (bỏ qua id không tải được) */
export async function resolveApproverNames(definition: WorkflowDefinition | null | undefined, known: Record<string, string> = {}) {
	const { userIds, principalIds } = collectApproverRefs(definition);
	const missingUsers = userIds.filter(id => !known[id]);
	const missingPrincipals = principalIds.filter(id => !known[id]);
	const [users, principals] = await Promise.all([
		Promise.allSettled(missingUsers.map(id => userService.fetchUserItem(id))),
		Promise.allSettled(missingPrincipals.map(id => principalService.fetchPrincipalItem(id))),
	]);
	const names: Record<string, string> = {};
	users.forEach((r, i) => {
		if (r.status === "fulfilled" && r.value)
			names[missingUsers[i]] = r.value.fullName || r.value.loginName || missingUsers[i];
	});
	principals.forEach((r, i) => {
		if (r.status === "fulfilled" && r.value)
			names[missingPrincipals[i]] = r.value.name || r.value.group?.name || r.value.user?.fullName || missingPrincipals[i];
	});
	return names;
}

/** Hook: tự tải tên người dùng / nhóm của một định nghĩa (bỏ qua các id đã có trong `known`) */
export function useWorkflowUserNames(definition: WorkflowDefinition | null | undefined, known?: Record<string, string>) {
	const [names, setNames] = useState<Record<string, string>>({});
	const missingKey = useMemo(() => {
		const { userIds, principalIds } = collectApproverRefs(definition);
		return [...userIds, ...principalIds].filter(id => !known?.[id]).sort().join(",");
	}, [definition, known]);
	useEffect(() => {
		if (!missingKey)
			return;
		let cancelled = false;
		resolveApproverNames(definition, known).then((res) => {
			if (!cancelled)
				setNames(prev => ({ ...prev, ...res }));
		});
		return () => {
			cancelled = true;
		};
		// missingKey đã đại diện cho definition + known
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [missingKey]);
	return useMemo(() => ({ ...names, ...known }), [names, known]);
}
