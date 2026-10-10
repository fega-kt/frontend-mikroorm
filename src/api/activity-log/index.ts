import type { ActivityLogEntity, ActivityLogSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class ActivityLogService extends CrudServiceBase<ActivityLogEntity> {
	constructor() {
		super({ endpoint: "activity-log", populate: ["createdBy"], service: ApiService.Core });
	}

	/** GET /activity-log — theo dõi activity log; backend tự giới hạn theo quyền (toàn hệ thống hoặc trong phòng ban) */
	async fetchList(params?: ActivityLogSearchParams) {
		return this.get<{ data: ActivityLogEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
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
