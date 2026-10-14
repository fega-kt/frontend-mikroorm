import type { RequestTypeEntity, RequestTypeSearchParams, RequestTypeVersionBrief, RequestTypeVersionDetail } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class RequestTypeService extends CrudServiceBase<RequestTypeEntity> {
	constructor() {
		super({ endpoint: "request-type", populate: ["category", "form"], service: ApiService.App });
	}

	async fetchRequestTypeList(params?: RequestTypeSearchParams) {
		return this.get<{ data: RequestTypeEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchRequestTypeItem(id: string) {
		return this.get<RequestTypeEntity>(id, { ignoreLoading: true });
	}

	async fetchVersions(id: string) {
		return this.get<RequestTypeVersionBrief[]>(`${id}/versions`, { ignoreLoading: true });
	}

	async fetchVersion(id: string, versionId: string) {
		return this.get<RequestTypeVersionDetail>(`${id}/versions/${versionId}`, { ignoreLoading: true });
	}

	async fetchRestoreVersion(id: string, versionId: string) {
		return this.post<{ id: string, version: number }>(`${id}/versions/${versionId}/restore`, { ignoreLoading: true });
	}

	async fetchAddRequestType(data: Partial<RequestTypeEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateRequestType(id: string, data: Partial<RequestTypeEntity>) {
		return this.put<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteRequestType(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const requestTypeService = new RequestTypeService();
