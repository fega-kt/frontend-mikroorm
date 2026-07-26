export interface WorkflowActionPayload {
	workflowTaskId: string
	comment?: string
}

export interface CancelWorkflowPayload {
	workflowInstanceId: string
	comment?: string
}

export interface RequestReviewPayload {
	workflowTaskId: string
	reviewerPrincipalIds: string[]
	comment?: string
}

export interface RequestToCancelPayload {
	workflowInstanceId: string
	approverPrincipalIds: string[]
	comment?: string
}
