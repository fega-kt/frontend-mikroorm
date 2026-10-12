import type { EmailTemplate, EmailTemplatePayload, EmailTemplatePreview, TemplateVariable } from "./types";
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
		return this.get<TemplateVariable[]>("variables", { ignoreLoading: true });
	}

	fetchPreview(data: { subject: string, body: string }) {
		return this.post<EmailTemplatePreview>("preview", { json: data as never, ignoreLoading: true });
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
