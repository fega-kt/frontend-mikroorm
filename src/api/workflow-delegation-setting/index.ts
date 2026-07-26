import type { WorkflowDelegationSettingEntity, WorkflowDelegationSettingSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class WorkflowDelegationSettingService extends CrudServiceBase<WorkflowDelegationSettingEntity> {
	constructor() {
		super({
			endpoint: "workflow-delegation-setting",
			populate: ["originalApprover", "delegatedApprovers", "requestTypes", "workflowSettings"],
			service: ApiService.App,
		});
	}

	async fetchWorkflowDelegationSettingList(params?: WorkflowDelegationSettingSearchParams) {
		return this.get<{ data: WorkflowDelegationSettingEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchWorkflowDelegationSettingItem(id: string) {
		return this.get<WorkflowDelegationSettingEntity>(id, { ignoreLoading: true });
	}

	async fetchAddWorkflowDelegationSetting(data: Partial<WorkflowDelegationSettingEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateWorkflowDelegationSetting(id: string, data: Partial<WorkflowDelegationSettingEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteWorkflowDelegationSetting(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const workflowDelegationSettingService = new WorkflowDelegationSettingService();
