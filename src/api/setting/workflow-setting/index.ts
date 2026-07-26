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

	/** Uploads an already-generated BPMN 2.0 XML file for deployment to the Flowable server. */
	async fetchDeployWorkflowSetting(id: string, file: Blob, processDefinitionKey: string) {
		const formData = new FormData();
		formData.append("file", file, "process.bpmn20.xml");
		formData.append("processDefinitionKey", processDefinitionKey);
		return this.post<WorkflowSettingEntity>(`${id}/deploy`, { body: formData });
	}

	/**
	 * The BPMN XML isn't persisted in our own DB (matches v5) — fetched from Flowable on demand
	 * by resolving the template's processDefinitionKey to its latest deployed version. Returns
	 * `xml: null` if never deployed yet.
	 */
	async fetchWorkflowSettingBpmnXml(id: string) {
		return this.get<{ xml: string | null }>(`${id}/bpmn-xml`, { ignoreLoading: true });
	}
}

export const workflowSettingService = new WorkflowSettingService();
