import type { PersonCard, PersonCardUser, PrincipalEntity, PrincipalSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class PrincipalService extends CrudServiceBase<PrincipalEntity> {
	constructor() {
		super({ endpoint: "principal", service: ApiService.Core });
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

	async fetchCard(id: string) {
		return this.get<PersonCard>(`${id}/card`, { ignoreLoading: true });
	}

	async fetchGroupMembers(id: string, page: number) {
		return this.get<{ data: PersonCardUser[], total: number }>(`${id}/members`, { searchParams: { page }, ignoreLoading: true });
	}

	async fetchUserCard(userId: string) {
		return this.get<PersonCard>(`card/user/${userId}`, { ignoreLoading: true });
	}

	async fetchPrincipalItem(id: string) {
		return this.get<PrincipalEntity>(id, { ignoreLoading: true });
	}
}

export const principalService = new PrincipalService();
