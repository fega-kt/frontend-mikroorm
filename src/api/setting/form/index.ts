import type { FormEntity, FormOption, FormSearchParams, FormVersionBrief, FormVersionDetail } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class FormService extends CrudServiceBase<FormEntity> {
	constructor() {
		super({ endpoint: "form", service: ApiService.App });
	}

	async fetchFormList(params?: FormSearchParams) {
		return this.get<{ data: FormEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchFormOptions() {
		return this.get<FormOption[]>("options", { ignoreLoading: true });
	}

	async fetchFormItem(id: string) {
		return this.get<FormEntity>(id, { ignoreLoading: true });
	}

	async fetchVersions(id: string) {
		return this.get<FormVersionBrief[]>(`${id}/versions`, { ignoreLoading: true });
	}

	async fetchVersion(id: string, versionId: string) {
		return this.get<FormVersionDetail>(`${id}/versions/${versionId}`, { ignoreLoading: true });
	}

	async fetchAddForm(data: Partial<FormEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateForm(id: string, data: Partial<FormEntity>) {
		return this.put<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteForm(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const formService = new FormService();
