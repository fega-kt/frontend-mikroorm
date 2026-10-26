/** Phạm vi chung: phòng ban (gồm phòng con) và loại tờ trình */
export interface ReportScopeParams {
	departmentId?: string
	requestTypeId?: string
}

/** Khoảng [from, to) dạng ISO */
export interface ReportRangeParams extends ReportScopeParams {
	from?: string
	to?: string
}

export interface ReportFilters {
	/** Có quyền xem toàn hệ thống; không có thì chỉ phòng ban của mình và phòng con */
	canViewAll: boolean
	departmentId: string | null
	requestTypes: { id: string, name: string }[]
}

export interface ReportPeriodSummary {
	sent: number
	approvalRate: number | null
	avgCycleSeconds: number | null
	resubmitted: number
	resubmitRate: number | null
}

export interface ReportOverview {
	current: ReportPeriodSummary
	previous: ReportPeriodSummary
	now: { pending: number, overdue: number, returned: number }
	weekly: { weekStart: string, approved: number, pending: number, returned: number, rejected: number, cancelled: number }[]
	topRequestTypes: { id: string, name: string, sent: number }[]
	departments: {
		id: string
		name: string
		sent: number
		pending: number
		rejected: number
		approvalRate: number | null
		avgCycleSeconds: number | null
	}[]
}

export interface ReportPerformance {
	handled: number
	avgResponseSeconds: number | null
	/** Số lượt ở bước có đặt hạn xử lý */
	withDue: number
	onTimeRate: number | null
	reminds: number
	escalations: number
	autoApproved: number
	autoRejected: number
	proxy: number
	approvers: {
		key: string
		name: string
		isGroup: boolean
		done: number
		proxy: number
		pending: number
		overdue: number
		avgResponseSeconds: number | null
		onTimeRate: number | null
	}[]
	steps: { name: string, handled: number, avgResponseSeconds: number | null }[]
}

export type AgingBucket = "lt1d" | "1to3d" | "3to7d" | "gt7d";

export interface ReportBacklogItem {
	taskId: string
	requestId: string
	code: string | null
	title: string
	requester: string
	step: string | null
	holder: string
	holderIsGroup: boolean
	receivedAt: string
	waitSeconds: number
	dueAt: string | null
	overdue: boolean
	reminds: number
	escalations: number
}

export interface ReportBacklog {
	pendingRequests: number
	overdueRequests: number
	returnedRequests: number
	oldest: { code: string | null, step: string | null, waitSeconds: number } | null
	aging: { key: AgingBucket, count: number }[]
	holders: { key: string, name: string, isGroup: boolean, pending: number, overdue: number }[]
	items: ReportBacklogItem[]
	total: number
}

export interface ReportRequestTypes {
	types: {
		id: string
		name: string
		category: string | null
		sent: number
		approvalRate: number | null
		rejectRate: number | null
		cancelRate: number | null
		resubmitRate: number | null
		avgRounds: number | null
		avgCycleSeconds: number | null
		topReturnStep: { name: string, times: number } | null
	}[]
	rounds: { one: number, two: number, more: number }
	topReturnSteps: { name: string, times: number }[]
}
