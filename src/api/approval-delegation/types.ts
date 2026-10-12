import type { UserBrief } from "#src/api/approval-request";
import type { EntityBase } from "#src/api/entity-base";
import type { SearchParamsBase } from "#src/api/service-base";

export interface ApprovalDelegationSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	tab?: "mine" | "toMe"
	activeOnly?: boolean
}

export interface ApprovalDelegationEntity extends EntityBase {
	fromUser: UserBrief
	toUser: UserBrief
	startAt: string
	endAt: string
	requestType?: { id: string, name: string } | null
	reason?: string
}

export interface ApprovalDelegationPayload {
	toUser: string
	startAt: string
	endAt: string
	requestType?: string | null
	reason?: string | null
}
