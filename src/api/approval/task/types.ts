import type { SearchParamsBase } from "#src/api/service-base.js";

export interface FlowableTask {
	id: string
	name: string
	description?: string
	assignee?: string
	created: string
	dueDate?: string
	processInstanceId: string
	processDefinitionId: string
	taskDefinitionKey: string
	businessKey?: string
	candidateGroups?: string[]
	variables?: Record<string, unknown>
}

export interface ApprovalTaskSearchParams extends SearchParamsBase {
	page?: number
	size?: number
}

export interface CompleteTaskDto {
	decision: "APPROVE" | "REJECT"
	comment?: string
}
