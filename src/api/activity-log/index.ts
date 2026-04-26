import type { ActivityLogEntity } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class ActivityLogService extends CrudServiceBase<ActivityLogEntity> {
	constructor() {
		super({ endpoint: "activity-log", populate: ["createdBy"] });
	}

	/** GET /activity-log/by-parent/:parentId */
	async fetchByParent(parentId: string, params?: { page?: number, limit?: number }) {
		return this.get<{ data: ActivityLogEntity[], total: number }>(`by-parent/${parentId}`, {
			searchParams: { page: 1, limit: 50, ...params } as any,
			ignoreLoading: true,
		});
	}
}

export const activityLogService = new ActivityLogService();
