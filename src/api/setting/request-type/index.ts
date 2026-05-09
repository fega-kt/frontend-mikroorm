import type { RequestTypeEntity, RequestTypeSearchParams } from "./types";
import { CrudServiceBase } from "../../service-base";

export * from "./types";

export class RequestTypeService extends CrudServiceBase<RequestTypeEntity> {
	constructor() {
		super({ endpoint: "request-type", populate: ["category"] });
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

	async fetchAddRequestType(data: Partial<RequestTypeEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateRequestType(id: string, data: Partial<RequestTypeEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteRequestType(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const requestTypeService = new RequestTypeService();
