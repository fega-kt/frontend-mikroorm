import type { Delegation, MyRequest, PendingApproval, RequestTypeCode } from "./mock";
import { approvalDelegationService } from "#src/api/approval-delegation";
import { approvalRequestService } from "#src/api/approval-request";
import { approvalTaskService } from "#src/api/approval-task";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** Đoán nhóm icon/màu từ mã hoặc tên loại đơn (loại đơn do admin tự đặt) */
const TYPE_RULES: [RegExp, RequestTypeCode][] = [
	[/LEAVE|NGHI|NP\b|PHEP/i, "leave"],
	[/ADVANCE|TAM.?UNG|TU\b/i, "advance"],
	[/PURCHASE|MUA|MS\b/i, "purchase"],
	[/TRIP|CONG.?TAC|CT\b/i, "trip"],
	[/PAY|THANH.?TOAN|TT\b/i, "payment"],
];

export function guessRequestTypeCode(...hints: (string | undefined)[]): RequestTypeCode {
	const text = hints.filter(Boolean).join(" ").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d");
	return TYPE_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "other";
}

export interface ApprovalDashboardData {
	pending: (PendingApproval & { dueAt?: string })[]
	myRequests: MyRequest[]
	delegation: { outgoing?: Delegation, incoming?: Delegation }
	loading: boolean
	reload: () => Promise<void>
}

/** Dữ liệu thật cho các ô dashboard: đơn chờ tôi duyệt, đơn của tôi, ủy quyền đang hiệu lực */
export function useApprovalDashboard(): ApprovalDashboardData {
	const { t } = useTranslation();
	const [pending, setPending] = useState<ApprovalDashboardData["pending"]>([]);
	const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
	const [delegation, setDelegation] = useState<ApprovalDashboardData["delegation"]>({});
	const [loading, setLoading] = useState(true);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const [inbox, mine, outgoing, incoming] = await Promise.all([
				approvalTaskService.fetchInbox({ tab: "pending", limit: 10 }),
				approvalRequestService.fetchMine({ limit: 20 }),
				approvalDelegationService.fetchList({ tab: "mine", activeOnly: true, limit: 5 }),
				approvalDelegationService.fetchList({ tab: "toMe", activeOnly: true, limit: 5 }),
			]);

			const seen = new Set<string>();
			setPending(inbox.data.filter(item => !seen.has(item.request.id) && seen.add(item.request.id)).map(item => ({
				id: item.request.id,
				type: guessRequestTypeCode(item.request.requestType.name, item.request.code),
				title: item.request.title,
				requesterId: item.request.requester.id,
				requesterName: item.request.requester.fullName,
				stepName: item.nodeName ?? item.nodeId,
				createdAt: item.createdAt,
				dueAt: item.dueAt,
			})));

			setMyRequests(mine.data.map(item => ({
				id: item.id,
				type: guessRequestTypeCode(item.requestType.code, item.requestType.name),
				title: item.title,
				submittedAt: item.submittedAt ?? item.createdAt,
				status: item.status,
				steps: [],
				currentStep: 0,
				note: [item.code, item.requestType.name].filter(Boolean).join(" · "),
			})));

			const now = Date.now();
			const active = <T extends { startAt: string }>(items: T[]) => items.find(item => new Date(item.startAt).getTime() <= now);
			const out = active(outgoing.data);
			const inc = active(incoming.data);
			setDelegation({
				outgoing: out && {
					userId: out.toUser.id,
					fullName: out.toUser.fullName,
					scope: out.requestType?.name ?? t("approval.delegation.allTypes"),
					fromDate: out.startAt,
					toDate: out.endAt,
				},
				incoming: inc && {
					userId: inc.fromUser.id,
					fullName: inc.fromUser.fullName,
					scope: inc.requestType?.name ?? t("approval.delegation.allTypes"),
					fromDate: inc.startAt,
					toDate: inc.endAt,
				},
			});
		}
		catch {
			// dashboard không chặn trang khi API lỗi
		}
		finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		reload();
	}, [reload]);

	return { pending, myRequests, delegation, loading, reload };
}
