import type { EmailBrand, EmailTemplate, EmailTemplateCategory, EmailTemplatePayload, EmailTemplatePreview, TemplateVariable } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class EmailTemplateService extends CrudServiceBase<EmailTemplate> {
	constructor() {
		super({ endpoint: "email-template", service: ApiService.App });
	}

	fetchList() {
		return this.get<EmailTemplate[]>("", { ignoreLoading: true });
	}

	fetchItem(code: string) {
		return this.get<EmailTemplate>(encodeURIComponent(code), { ignoreLoading: true });
	}

	fetchVariables() {
		return this.get<Record<EmailTemplateCategory, TemplateVariable[]>>("variables", { ignoreLoading: true });
	}

	/** `code`: mẫu đang sửa — chọn dữ liệu mẫu theo nhóm; bỏ trống = mẫu tùy chỉnh */
	fetchPreview(data: { subject: string, body: string, code?: string }) {
		return this.post<EmailTemplatePreview>("preview", { json: data as never, ignoreLoading: true });
	}

	fetchBrand() {
		return this.get<EmailBrand>("brand", { ignoreLoading: true });
	}

	/** Nội dung khởi đầu khi tạo mẫu tùy chỉnh */
	fetchStarter() {
		return this.get<{ body: string }>("starter", { ignoreLoading: true });
	}

	fetchCreate(data: EmailTemplatePayload & { code: string }) {
		return this.post<EmailTemplate>("", { json: data as never, ignoreLoading: true });
	}

	fetchUpdate(code: string, data: EmailTemplatePayload) {
		return this.patch<EmailTemplate>(encodeURIComponent(code), { json: data as never, ignoreLoading: true });
	}

	/** Mẫu tùy chỉnh: xoá; mẫu hệ thống: khôi phục mặc định */
	fetchDelete(code: string) {
		return this.delete<{ code: string, reset: boolean }>(encodeURIComponent(code), { ignoreLoading: true });
	}
}

export const emailTemplateService = new EmailTemplateService();
