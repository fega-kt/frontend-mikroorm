import type { TimeLogEntity, TimeLogPayload, TimeLogReviewPayload, TimeLogSummary } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class TimeLogService extends CrudServiceBase<TimeLogEntity> {
	constructor() {
		super({ endpoint: "timelog", populate: ["task", "user", "reviewedBy"] });
	}

	/** GET /timelog/by-task/:taskId */
	async fetchLogsByTask(taskId: string, params?: Record<string, any>) {
		return this.get<{ data: TimeLogEntity[], total: number }>(`by-task/${taskId}`, {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** GET /timelog/by-task/:taskId/summary */
	async fetchSummaryByTask(taskId: string) {
		return this.get<TimeLogSummary>(`by-task/${taskId}/summary`, { ignoreLoading: true });
	}

	/** POST /timelog */
	async fetchCreateTimeLog(data: TimeLogPayload) {
		return this.post<TimeLogEntity>("", { json: data, ignoreLoading: true });
	}

	/** PATCH /timelog/:id */
	async fetchUpdateTimeLog(id: string, data: TimeLogPayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** PATCH /timelog/:id/review */
	async fetchReviewTimeLog(id: string, data: TimeLogReviewPayload) {
		return this.patch<void>(`${id}/review`, { json: data, ignoreLoading: true });
	}

	/** DELETE /timelog/:id */
	async fetchDeleteTimeLog(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const timeLogService = new TimeLogService();
