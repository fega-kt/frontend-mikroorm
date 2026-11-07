/** Danh sách xuất được (khóa trong đường dẫn API) */
export const EXPORT_RESOURCES = [
	"approval-request-mine",
	"approval-request-all",
	"approval-inbox",
	"approval-delegation",
	"user",
	"department",
	"group",
	"role",
	"activity-log",
	"activity-log-queue",
] as const;
export type ExportResource = (typeof EXPORT_RESOURCES)[number];

export type ExportLanguage = "vi-VN" | "en-US" | "zh-CN";

/** Từ số dòng này backend chạy nền (thông báo khi xong) thay vì tải ngay — khớp EXPORT_INSTANT_MAX_ROWS của backend; backend vẫn là nơi quyết định */
export const EXPORT_BACKGROUND_THRESHOLD = 50_000;

/** Cột xuất: khóa của backend + nhãn đang hiển thị (bỏ trống = nhãn mặc định của backend) */
export interface ExportColumnRequest {
	key: string
	header?: string
}

export interface ExportPayload {
	/** Đúng bộ lọc của lần tải danh sách gần nhất (backend tự kiểm theo từng danh sách, bỏ qua page / limit) */
	filter: Record<string, unknown>
	/** Cột đang hiển thị; bỏ trống = mọi cột */
	columns?: ExportColumnRequest[]
	lang: ExportLanguage
	/** Chỉ có tác dụng khi chạy nền: gửi email (kèm file nếu đủ nhỏ) tới chính mình khi xong */
	sendEmail?: boolean
}

/** Ít dòng: link tải dùng một lần (trình duyệt tải ngay) */
export interface ExportDownloadResult {
	mode: "download"
	downloadPath: string
	filename: string
	count: number
}

/** Nhiều dòng: job chạy nền, kết quả ở lịch sử xuất */
export interface ExportQueuedResult {
	mode: "queued"
	jobId: string
	filename: string
	count: number
}

export type ExportPrepareResult = ExportDownloadResult | ExportQueuedResult;

export enum ExportJobStatus {
	Queued = "queued",
	Processing = "processing",
	Done = "done",
	Failed = "failed",
	Cancelled = "cancelled",
	Expired = "expired",
}

export enum ExportEmailStatus {
	None = "none",
	Pending = "pending",
	Sent = "sent",
	Failed = "failed",
}

/** Một lượt xuất chạy nền (lịch sử xuất của tôi) */
export interface ExportJob {
	id: string
	resource: ExportResource
	filename: string
	status: ExportJobStatus
	/** Số dòng dự kiến */
	total: number
	/** Số dòng đã ghi */
	processed: number
	/** > 1: kết quả là zip chứa nhiều file xlsx */
	parts: number
	size: number | null
	/** Mã lỗi ngắn (TIMEOUT, WORKER_LOST, UNKNOWN_RESOURCE, FAILED) */
	error: string | null
	sendEmail: boolean
	emailStatus: ExportEmailStatus
	createdAt: string
	startedAt: string | null
	finishedAt: string | null
	expiresAt: string | null
	/** Đã xong và còn trong hạn lưu */
	downloadable: boolean
}

export interface ExportJobSearchParams {
	page?: number
	limit?: number
}
