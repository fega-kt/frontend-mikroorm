import type { WorkflowInstanceEntity, WorkflowInstanceSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class WorkflowInstanceService extends CrudServiceBase<WorkflowInstanceEntity> {
	constructor() {
		super({ endpoint: "workflow-instance", populate: ["requestType", "workflowSetting"], service: ApiService.App });
	}

	async fetchWorkflowInstanceList(params?: WorkflowInstanceSearchParams) {
		return this.get<{ data: WorkflowInstanceEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchWorkflowInstanceItem(id: string) {
		return this.get<WorkflowInstanceEntity>(id, { ignoreLoading: true });
	}

	async fetchAddWorkflowInstance(data: Partial<WorkflowInstanceEntity>) {
		return this.post<WorkflowInstanceEntity>("", { json: data, ignoreLoading: true });
	}

	async startWorkflowInstance(id: string) {
		return this.post<WorkflowInstanceEntity>(`${id}/start`, { ignoreLoading: true });
	}
}

export const workflowInstanceService = new WorkflowInstanceService();
