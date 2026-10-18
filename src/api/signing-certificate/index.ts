import type { MySigningCertificate, SigningCertificate, SigningCertificateSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Chứng thư ký số nội bộ: đăng ký của tôi + quản trị duyệt / thu hồi */
export class SigningCertificateService extends CrudServiceBase<SigningCertificate> {
	constructor() {
		super({ endpoint: "signing-certificate", service: ApiService.Core });
	}

	fetchMine() {
		return this.get<MySigningCertificate | null>("mine", { ignoreLoading: true });
	}

	/** Tạo khóa ký có thể mất vài giây (service ký số sinh khóa RSA + băm PIN) */
	fetchEnroll(data: { pin: string, signatureImage?: string | null }) {
		return this.post<{ id: string }>("mine", { json: data as never, ignoreLoading: true, timeout: 60_000 });
	}

	fetchCancelMine() {
		return this.delete<{ id: string }>("mine", { ignoreLoading: true });
	}

	fetchChangePin(data: { oldPin: string, newPin: string }) {
		return this.post<{ id: string }>("mine/change-pin", { json: data as never, ignoreLoading: true, timeout: 60_000, retry: 0 });
	}

	fetchUpdateSignatureImage(signatureImage: string | null) {
		return this.put<{ id: string }>("mine/signature-image", { json: { signatureImage } as never, ignoreLoading: true });
	}

	fetchList(params?: SigningCertificateSearchParams) {
		return this.get<{ data: SigningCertificate[], total: number }>("", { searchParams: params as never, ignoreLoading: true });
	}

	fetchApprove(id: string) {
		return this.post<{ id: string }>(`${id}/approve`, { ignoreLoading: true, timeout: 60_000 });
	}

	fetchReject(id: string, note?: string) {
		return this.post<{ id: string }>(`${id}/reject`, { json: { note } as never, ignoreLoading: true });
	}

	fetchRevoke(id: string, note?: string) {
		return this.post<{ id: string }>(`${id}/revoke`, { json: { note } as never, ignoreLoading: true });
	}
}

export const signingCertificateService = new SigningCertificateService();
