import type { PresignedUpload } from "#src/api/attachment";
import type { PdfSignatureInfo } from "#src/api/signing-certificate/types";
import type {
	ApprovalRequestDetail,
	ApprovalRequestListItem,
	ApprovalRequestPayload,
	ApprovalRequestSearchParams,
	ApprovalSharePayload,
	CreatableRequestType,
	PreviewFlowResult,
	RequestFileCategory,
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

	/** Chữ ký số trên một văn bản PDF của tờ trình */
	fetchSignatures(id: string, fileId: string) {
		return this.get<PdfSignatureInfo[]>(`${id}/files/${fileId}/signatures`, { ignoreLoading: true, timeout: 60_000 });
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

	/** Xin link upload thẳng lên R2 cho tệp của tờ trình (id có thể chưa tồn tại — phiếu đang soạn ở client) */
	fetchPresignFileUpload(id: string, category: RequestFileCategory, file: File) {
		return this.post<PresignedUpload>(`${id}/files/presign-upload`, {
			json: { category, filename: file.name, mimetype: file.type, size: file.size } as never,
			ignoreLoading: true,
		});
	}

	fetchCancel(id: string, comment?: string) {
		return this.post<{ id: string }>(`${id}/cancel`, { json: { comment } as never, ignoreLoading: true });
	}

	fetchShare(id: string, data: ApprovalSharePayload) {
		return this.post<{ id: string }>(`${id}/shares`, { json: data as never, ignoreLoading: true });
	}

	fetchRemoveShare(id: string, shareId: string) {
		return this.delete<void>(`${id}/shares/${shareId}`, { ignoreLoading: true });
	}
}

export const approvalRequestService = new ApprovalRequestService();
