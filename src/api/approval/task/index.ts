import type { ApprovalTaskSearchParams, CompleteTaskDto, FlowableTask } from "./types";
import { CrudServiceBase } from "#src/api/service-base.js";

export * from "./types";

export class ApprovalTaskService extends CrudServiceBase<FlowableTask> {
	constructor() {
		super({ endpoint: "tasks" });
	}

	async fetchMyTasks(params?: ApprovalTaskSearchParams) {
		return this.get<{ data: FlowableTask[], total: number }>("my-tasks", {
			searchParams: params,
			ignoreLoading: true,
		} as any);
	}

	async completeTask(taskId: string, dto: CompleteTaskDto) {
		return this.post<void>(`${taskId}/complete`, {
			json: dto,
			ignoreLoading: true,
		} as any);
	}

	async claimTask(taskId: string) {
		return this.post<void>(`${taskId}/claim`, { ignoreLoading: true } as any);
	}
}

export const approvalTaskService = new ApprovalTaskService();
