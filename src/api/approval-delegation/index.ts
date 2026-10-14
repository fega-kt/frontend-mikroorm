import type { ApprovalDelegationEntity, ApprovalDelegationPayload, ApprovalDelegationSearchParams, ApprovalDelegationUpdatePayload } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class ApprovalDelegationService extends CrudServiceBase<ApprovalDelegationEntity> {
	constructor() {
		super({ endpoint: "approval-delegation", service: ApiService.App });
	}

	fetchList(params?: ApprovalDelegationSearchParams) {
		return this.get<{ data: ApprovalDelegationEntity[], total: number }>("", { searchParams: params, ignoreLoading: true });
	}

	fetchItem(id: string) {
		return this.get<ApprovalDelegationEntity>(id, { ignoreLoading: true });
	}

	fetchCreate(data: ApprovalDelegationPayload) {
		return this.post<{ id: string }>("", { json: data as never, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: ApprovalDelegationUpdatePayload) {
		return this.patch<{ id: string }>(id, { json: data as never, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const approvalDelegationService = new ApprovalDelegationService();
