import type { DownloadDisposition, SignedFileUrl } from "#src/api/attachment";
import type {
	ApprovalRequestDetail,
	ApprovalRequestListItem,
	ApprovalRequestPayload,
	ApprovalRequestSearchParams,
	CreatableRequestType,
	PreviewFlowResult,
	SubmitUnit,
} from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class ApprovalRequestService extends CrudServiceBase<ApprovalRequestListItem> {
	constructor() {
		super({ endpoint: "approval-request", service: ApiService.App });
	}

	fetchRequestTypes() {
		return this.get<CreatableRequestType[]>("request-types", { ignoreLoading: true });
	}

	fetchSubmitUnits() {
		return this.get<SubmitUnit[]>("submit-units", { ignoreLoading: true });
	}

	fetchPreview(data: { requestType: string, department?: string, payload: Record<string, unknown> }) {
		return this.post<PreviewFlowResult>("preview", { json: data as never, ignoreLoading: true });
	}

	fetchMine(params?: ApprovalRequestSearchParams) {
		return this.get<{ data: ApprovalRequestListItem[], total: number }>("mine", { searchParams: params, ignoreLoading: true });
	}

	fetchAll(params?: ApprovalRequestSearchParams) {
		return this.get<{ data: ApprovalRequestListItem[], total: number }>("", { searchParams: params, ignoreLoading: true });
	}

	fetchDetail(id: string) {
		return this.get<ApprovalRequestDetail>(id, { ignoreLoading: true });
	}

	fetchCreate(data: ApprovalRequestPayload) {
		return this.post<{ id: string }>("", { json: data as never, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: Partial<Omit<ApprovalRequestPayload, "requestType" | "submit">>) {
		return this.patch<{ id: string }>(id, { json: data as never, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	fetchSubmit(id: string) {
		return this.post<{ id: string }>(`${id}/submit`, { ignoreLoading: true });
	}

	/** Link xem/tải tạm thời của tệp thuộc tờ trình (backend kiểm quyền xem tờ trình) */
	fetchFileUrl(id: string, fileId: string, disposition: DownloadDisposition = "attachment") {
		return this.get<SignedFileUrl>(`${id}/files/${fileId}/download-url`, { searchParams: { disposition }, ignoreLoading: true });
	}

	fetchCancel(id: string, comment?: string) {
		return this.post<{ id: string }>(`${id}/cancel`, { json: { comment } as never, ignoreLoading: true });
	}
}

export const approvalRequestService = new ApprovalRequestService();
