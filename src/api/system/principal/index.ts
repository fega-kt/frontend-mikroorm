import type { PrincipalEntity, PrincipalSearchParams } from "./types";
import { CrudServiceBase } from "../../service-base";

export * from "./types";

export class PrincipalService extends CrudServiceBase<PrincipalEntity> {
	constructor() {
		super({ endpoint: "principal" });
	}

	async fetchPrincipalList(params?: PrincipalSearchParams) {
		return this.get<{ data: PrincipalEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchAddPrincipal(data: Partial<PrincipalEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdatePrincipal(id: string, data: Partial<PrincipalEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeletePrincipal(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	async fetchPrincipalItem(id: string) {
		return this.get<PrincipalEntity>(id, { ignoreLoading: true });
	}
}

export const principalService = new PrincipalService();
