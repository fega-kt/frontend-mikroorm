import type { SignaturePlacement, SigningPreparation } from "../signing-certificate/types";
import type { ApprovalRateStats, ApprovedStats, BulkApproveResult, InboxItem, InboxSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export type ApprovalActionType = "approve" | "reject" | "return";

export class ApprovalTaskService extends CrudServiceBase<InboxItem> {
	constructor() {
		super({ endpoint: "approval-task", service: ApiService.App });
	}

	fetchInbox(params?: InboxSearchParams) {
		return this.get<{ data: InboxItem[], total: number }>("inbox", { searchParams: params, ignoreLoading: true });
	}

	fetchPendingCount() {
		return this.get<{ total: number }>("inbox/count", { ignoreLoading: true });
	}

	fetchApprovedStats() {
		return this.get<ApprovedStats>("stats/approved", { ignoreLoading: true });
	}

	fetchApprovalRateStats() {
		return this.get<ApprovalRateStats>("stats/approval-rate", { ignoreLoading: true });
	}

	fetchAct(requestId: string, action: ApprovalActionType, comment?: string) {
		return this.post<{ id: string }>(`${requestId}/${action}`, { json: { comment } as never, ignoreLoading: true });
	}

	/** Mở hộp "Ký và duyệt": backend chuyển Word/Excel sang PDF nếu cần nên có thể mất vài chục giây */
	fetchPrepareSigning(requestId: string) {
		return this.get<SigningPreparation>(`${requestId}/signing`, { ignoreLoading: true, timeout: 180_000, retry: 0 });
	}

	fetchSignApprove(requestId: string, data: { pin: string, comment?: string, placements?: Record<string, SignaturePlacement> }) {
		return this.post<{ id: string }>(`${requestId}/sign-approve`, { json: data as never, ignoreLoading: true, timeout: 180_000, retry: 0 });
	}

	fetchBulkApprove(requestIds: string[], comment?: string) {
		return this.post<BulkApproveResult>("bulk-approve", { json: { requestIds, comment } as never, ignoreLoading: true });
	}

	fetchReassign(taskId: string, userId: string, comment?: string) {
		return this.post<{ id: string }>(`tasks/${taskId}/reassign`, { json: { userId, comment } as never, ignoreLoading: true });
	}
}

export const approvalTaskService = new ApprovalTaskService();
