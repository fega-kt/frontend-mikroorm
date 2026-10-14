import type { Approver, WorkflowDefinition } from "#src/api/approval-workflow/types";
import { ApproverType, NodeType } from "#src/api/approval-workflow/types";
import { principalService } from "#src/api/system/principal";
import { PrincipalType } from "#src/api/system/principal/types";
import { userService } from "#src/api/user";
import { useRequest } from "ahooks";
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

/** Thông tin hiển thị của người duyệt cấu hình trong quy trình (người dùng hoặc principal) */
export interface ApproverProfile {
	name: string
	/** Principal là nhóm → hiện icon nhóm thay vì avatar */
	isGroup: boolean
	/** id người dùng thật (principal loại user trỏ tới user) — để màu avatar khớp với avatar ở chỗ khác */
	userId?: string
	avatar?: string
}

/** Tải thông tin các id người dùng / principal của định nghĩa, trừ id trong `skip` (bỏ qua id không tải được) */
export async function resolveApproverProfiles(definition: WorkflowDefinition | null | undefined, skip: Record<string, unknown> = {}) {
	const { userIds, principalIds } = collectApproverRefs(definition);
	const missingUsers = userIds.filter(id => !skip[id]);
	const missingPrincipals = principalIds.filter(id => !skip[id]);
	const [users, principals] = await Promise.all([
		Promise.allSettled(missingUsers.map(id => userService.fetchUserItem(id))),
		Promise.allSettled(missingPrincipals.map(id => principalService.fetchPrincipalItem(id))),
	]);
	const profiles: Record<string, ApproverProfile> = {};
	users.forEach((r, i) => {
		if (r.status === "fulfilled" && r.value) {
			const id = missingUsers[i];
			profiles[id] = { name: r.value.fullName || r.value.loginName || id, isGroup: false, userId: id, avatar: r.value.avatar || undefined };
		}
	});
	principals.forEach((r, i) => {
		if (r.status === "fulfilled" && r.value) {
			const { name, type, group, user } = r.value;
			profiles[missingPrincipals[i]] = {
				name: name || group?.name || user?.fullName || missingPrincipals[i],
				// Ưu tiên loại principal; dữ liệu thiếu loại thì xét có trỏ tới người dùng hay không
				isGroup: type ? type === PrincipalType.Group : !user,
				userId: user?.id,
				avatar: user?.avatar || undefined,
			};
		}
	});
	return profiles;
}

/** Lấy tên hiển thị cho các id còn thiếu trong `known` (bỏ qua id không tải được) */
export async function resolveApproverNames(definition: WorkflowDefinition | null | undefined, known: Record<string, string> = {}) {
	const profiles = await resolveApproverProfiles(definition, known);
	return Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, profile.name]));
}

/** Hook: thông tin (tên, avatar, người / nhóm) của mọi người duyệt trong định nghĩa — cache theo tập id để nhiều chỗ dùng chung một lần tải */
export function useWorkflowApproverProfiles(definition: WorkflowDefinition | null | undefined) {
	const key = useMemo(() => {
		const { userIds, principalIds } = collectApproverRefs(definition);
		return [...userIds, ...principalIds].sort().join(",");
	}, [definition]);
	const { data } = useRequest(() => resolveApproverProfiles(definition), {
		ready: !!key,
		refreshDeps: [key],
		cacheKey: `approver-profiles-${key}`,
		staleTime: 60_000,
	});
	return data ?? {};
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
