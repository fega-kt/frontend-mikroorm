import type { BulkApproveResult, InboxItem, InboxSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export type ApprovalActionType = "approve" | "reject" | "return";

export class ApprovalTaskService extends CrudServiceBase<InboxItem> {
	constructor() {
		super({ endpoint: "approval", service: ApiService.App });
	}

	fetchInbox(params?: InboxSearchParams) {
		return this.get<{ data: InboxItem[], total: number }>("inbox", { searchParams: params, ignoreLoading: true });
	}

	fetchPendingCount() {
		return this.get<{ total: number }>("inbox/count", { ignoreLoading: true });
	}

	fetchAct(requestId: string, action: ApprovalActionType, comment?: string) {
		return this.post<{ id: string }>(`${requestId}/${action}`, { json: { comment } as never, ignoreLoading: true });
	}

	fetchBulkApprove(requestIds: string[], comment?: string) {
		return this.post<BulkApproveResult>("bulk-approve", { json: { requestIds, comment } as never, ignoreLoading: true });
	}

	fetchReassign(taskId: string, userId: string, comment?: string) {
		return this.post<{ id: string }>(`tasks/${taskId}/reassign`, { json: { userId, comment } as never, ignoreLoading: true });
	}
}

export const approvalTaskService = new ApprovalTaskService();
