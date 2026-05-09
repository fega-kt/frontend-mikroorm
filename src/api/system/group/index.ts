import type { GroupEntity, GroupSearchParams } from "./types";
import { CrudServiceBase } from "../../service-base";

export * from "./types";

export class GroupService extends CrudServiceBase<GroupEntity> {
	constructor() {
		super({
			endpoint: "group",
			populate: ["users", "principal"],
		});
	}

	async fetchGroupList(params?: GroupSearchParams) {
		return this.get<{ data: GroupEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchAddGroup(data: Partial<GroupEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateGroup(id: string, data: Partial<GroupEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteGroup(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	async fetchGroupItem(id: string) {
		return this.get<GroupEntity>(id, { ignoreLoading: true });
	}
}

export const groupService = new GroupService();
