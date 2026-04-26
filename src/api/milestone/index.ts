import type { MilestoneEntity, MilestonePayload } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class MilestoneService extends CrudServiceBase<MilestoneEntity> {
	constructor() {
		super({ endpoint: "milestone", populate: ["project"] });
	}

	/** GET /milestone/by-project/:projectId */
	async fetchMilestonesByProject(projectId: string, params?: Record<string, any>) {
		return this.get<{ data: MilestoneEntity[], total: number }>(`by-project/${projectId}`, {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** GET /milestone/by-project/:projectId/overdue */
	async fetchOverdueMilestones(projectId: string) {
		return this.get<{ data: MilestoneEntity[], total: number }>(`by-project/${projectId}/overdue`, {
			ignoreLoading: true,
		});
	}

	/** GET /milestone/:id */
	async fetchMilestoneDetail(id: string) {
		return this.get<MilestoneEntity>(id, { ignoreLoading: true });
	}

	/** POST /milestone */
	async fetchCreateMilestone(data: MilestonePayload) {
		return this.post<MilestoneEntity>("", { json: data, ignoreLoading: true });
	}

	/** PATCH /milestone/:id */
	async fetchUpdateMilestone(id: string, data: MilestonePayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** DELETE /milestone/:id */
	async fetchDeleteMilestone(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const milestoneService = new MilestoneService();
