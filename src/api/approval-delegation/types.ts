import type { UserBrief } from "#src/api/approval-request";
import type { EntityBase } from "#src/api/entity-base";
import type { SearchParamsBase } from "#src/api/service-base";

/** Kiểu ủy quyền — đồng bộ backend ApprovalDelegationMode */
export enum ApprovalDelegationMode {
	/** Trong thời gian ủy quyền được xử lý thay mọi phiếu đang chờ (cả phiếu đến trước); hết hạn là hết quyền */
	Window = "window",
	/** Phiếu đến trong thời gian ủy quyền được giao xử lý đến khi xong, kể cả sau khi hết hạn */
	Handover = "handover",
}

/** mine: tôi ủy quyền; toMe: ủy quyền cho tôi; all: mọi ủy quyền (cần quyền quản lý ủy quyền) */
export type ApprovalDelegationTab = "mine" | "toMe" | "all";

export interface ApprovalDelegationSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	tab?: ApprovalDelegationTab
	activeOnly?: boolean
}

export interface ApprovalDelegationEntity extends Omit<EntityBase, "createdBy"> {
	fromUser: UserBrief
	toUser: UserBrief
	/** Người tạo — khác fromUser khi được tạo hộ */
	createdBy?: UserBrief
	startAt: string
	endAt: string
	mode: ApprovalDelegationMode
	requestType?: { id: string, name: string } | null
	reason?: string
}

export interface ApprovalDelegationPayload {
	/** Người ủy quyền — bỏ trống = chính mình; chỉ gửi khi tạo hộ (cần quyền quản lý ủy quyền) */
	fromUser?: string | null
	toUser: string
	startAt: string
	endAt: string
	mode: ApprovalDelegationMode
	requestType?: string | null
	reason?: string | null
}
