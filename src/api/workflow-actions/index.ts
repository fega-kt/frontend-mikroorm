import type { CancelWorkflowPayload, RequestReviewPayload, RequestToCancelPayload, WorkflowActionPayload } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class WorkflowActionsService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "workflow-actions", service: ApiService.App });
	}

	approveTask(data: WorkflowActionPayload) {
		return this.post<void>("approve", { json: data, ignoreLoading: true });
	}

	rejectTask(data: WorkflowActionPayload) {
		return this.post<void>("reject", { json: data, ignoreLoading: true });
	}

	returnTask(data: WorkflowActionPayload) {
		return this.post<void>("return", { json: data, ignoreLoading: true });
	}

	cancelWorkflow(data: CancelWorkflowPayload) {
		return this.post<void>("cancel", { json: data, ignoreLoading: true });
	}

	requestToChange(data: WorkflowActionPayload) {
		return this.post<void>("request-to-change", { json: data, ignoreLoading: true });
	}

	applyChange(data: WorkflowActionPayload) {
		return this.post<void>("apply-change", { json: data, ignoreLoading: true });
	}

	requestReview(data: RequestReviewPayload) {
		return this.post<void>("request-review", { json: data, ignoreLoading: true });
	}

	submitReview(data: WorkflowActionPayload) {
		return this.post<void>("submit-review", { json: data, ignoreLoading: true });
	}

	requestToCancel(data: RequestToCancelPayload) {
		return this.post<void>("request-to-cancel", { json: data, ignoreLoading: true });
	}

	approveCancellation(data: WorkflowActionPayload) {
		return this.post<void>("approve-cancellation", { json: data, ignoreLoading: true });
	}

	rejectCancellation(data: WorkflowActionPayload) {
		return this.post<void>("reject-cancellation", { json: data, ignoreLoading: true });
	}
}

export const workflowActionsService = new WorkflowActionsService();
