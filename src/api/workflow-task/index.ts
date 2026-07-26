import type { WorkflowTaskEntity, WorkflowTaskSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class WorkflowTaskService extends CrudServiceBase<WorkflowTaskEntity> {
	constructor() {
		super({ endpoint: "workflow-task", populate: ["workflowInstance", "approver"], service: ApiService.App });
	}

	async fetchMyTasks(params?: WorkflowTaskSearchParams) {
		return this.get<{ data: WorkflowTaskEntity[], total: number }>("my-tasks", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchWorkflowTaskItem(id: string) {
		return this.get<WorkflowTaskEntity>(id, { ignoreLoading: true });
	}
}

export const workflowTaskService = new WorkflowTaskService();
