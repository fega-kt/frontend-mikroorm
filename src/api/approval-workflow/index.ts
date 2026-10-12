import type { WorkflowDefinition } from "./definition";
import type {
	ApprovalWorkflowDetail,
	ApprovalWorkflowEntity,
	ApprovalWorkflowPayload,
	ApprovalWorkflowSearchParams,
	ApprovalWorkflowVersion,
	GraphError,
	SimulateResult,
} from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class ApprovalWorkflowService extends CrudServiceBase<ApprovalWorkflowEntity> {
	constructor() {
		super({ endpoint: "approval-workflow", service: ApiService.App });
	}

	fetchList(params?: ApprovalWorkflowSearchParams) {
		return this.get<{ data: ApprovalWorkflowEntity[], total: number }>("", { searchParams: params, ignoreLoading: true });
	}

	fetchDetail(id: string) {
		return this.get<ApprovalWorkflowDetail>(id, { ignoreLoading: true });
	}

	fetchCreate(data: ApprovalWorkflowPayload) {
		return this.post<{ id: string }>("", { json: data, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: Partial<ApprovalWorkflowPayload>) {
		return this.patch<{ id: string }>(id, { json: data, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	fetchVersions(id: string) {
		return this.get<ApprovalWorkflowVersion[]>(`${id}/versions`, { ignoreLoading: true });
	}

	fetchVersion(id: string, versionId: string) {
		return this.get<ApprovalWorkflowVersion>(`${id}/versions/${versionId}`, { ignoreLoading: true });
	}

	fetchRestoreVersion(id: string, versionId: string) {
		return this.post<{ id: string, version: number }>(`${id}/versions/${versionId}/restore`, { ignoreLoading: true });
	}

	fetchSaveDraft(id: string, definition: WorkflowDefinition) {
		return this.put<{ id: string, version: number, updatedAt: string }>(`${id}/draft`, { json: { definition }, ignoreLoading: true });
	}

	fetchValidate(id: string, definition?: WorkflowDefinition) {
		return this.post<{ valid: boolean, errors: GraphError[] }>(`${id}/validate`, { json: { definition }, ignoreLoading: true });
	}

	fetchSimulate(id: string, data: { definition?: WorkflowDefinition, payload: Record<string, unknown>, requesterId?: string }) {
		return this.post<SimulateResult>(`${id}/simulate`, { json: data, ignoreLoading: true });
	}

	fetchPublish(id: string) {
		return this.post<{ id: string, version: number, publishedAt: string }>(`${id}/publish`, { ignoreLoading: true });
	}
}

export const approvalWorkflowService = new ApprovalWorkflowService();
