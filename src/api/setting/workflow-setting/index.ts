import type { WorkflowSettingEntity, WorkflowSettingPayload, WorkflowSettingSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class WorkflowSettingService extends CrudServiceBase<WorkflowSettingEntity> {
	constructor() {
		super({ endpoint: "workflow-setting", populate: ["category"], service: ApiService.App });
	}

	async fetchWorkflowSettingList(params?: WorkflowSettingSearchParams) {
		return this.get<{ data: WorkflowSettingEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchWorkflowSettingItem(id: string) {
		return this.get<WorkflowSettingEntity>(id, { ignoreLoading: true });
	}

	async fetchAddWorkflowSetting(data: WorkflowSettingPayload) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateWorkflowSetting(id: string, data: WorkflowSettingPayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteWorkflowSetting(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const workflowSettingService = new WorkflowSettingService();
