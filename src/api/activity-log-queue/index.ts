import type { ActivityLogQueueItem, ActivityLogQueueSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class ActivityLogQueueService extends CrudServiceBase<ActivityLogQueueItem> {
	constructor() {
		super({ endpoint: "activity-log-queue", service: ApiService.Core });
	}

	/** GET /activity-log-queue — hàng đợi gửi mail, mới nhất trước */
	fetchList(params?: ActivityLogQueueSearchParams) {
		return this.get<{ items: ActivityLogQueueItem[], total: number }>("", {
			searchParams: params as Record<string, string>,
			ignoreLoading: true,
		});
	}

	/** POST /activity-log-queue/:id/retry — đẩy lại email vào queue để gửi lại */
	fetchRetry(id: string) {
		return this.post<{ success: boolean, error?: string }>(`${id}/retry`, { ignoreLoading: true });
	}
}

export const activityLogQueueService = new ActivityLogQueueService();
