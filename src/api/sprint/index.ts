import type { SprintEntity, SprintPayload } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class SprintService extends CrudServiceBase<SprintEntity> {
	constructor() {
		super({ endpoint: "sprint", populate: ["project"] });
	}

	/** GET /sprint/by-project/:projectId */
	async fetchSprintsByProject(projectId: string, params?: Record<string, any>) {
		return this.get<{ data: SprintEntity[], total: number }>(`by-project/${projectId}`, {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** GET /sprint/:id */
	async fetchSprintDetail(id: string) {
		return this.get<SprintEntity>(id, { ignoreLoading: true });
	}

	/** POST /sprint */
	async fetchCreateSprint(data: SprintPayload) {
		return this.post<SprintEntity>("", { json: data, ignoreLoading: true });
	}

	/** PATCH /sprint/:id */
	async fetchUpdateSprint(id: string, data: SprintPayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** DELETE /sprint/:id */
	async fetchDeleteSprint(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const sprintService = new SprintService();
