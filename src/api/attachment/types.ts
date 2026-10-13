import type { EntityBase } from "../entity-base";

export enum AttachmentVisibility {
	Public = "public",
	Private = "private",
}

export interface AttachmentEntity extends EntityBase {
	/** Tên file gốc khi upload */
	filename: string
	/** MIME type của file (vd: image/png, application/pdf) */
	mimetype: string
	/** Dung lượng file tính bằng bytes */
	size: number
	/** Key lưu trên R2 storage (dùng để xóa hoặc tạo URL) */
	key: string
	/** URL công khai để truy cập file; rỗng với file private — dùng link ký tạm (xem fetchDownloadUrl) */
	url: string
	/** private: chỉ xem/tải qua link ký tạm sau khi backend kiểm quyền */
	visibility: AttachmentVisibility
	/** Thư mục lưu trữ trên R2 (phải thuộc STORAGE_PATH) */
	storagePath: string
}

export type DownloadDisposition = "inline" | "attachment";

/** Link tạm thời để xem/tải file private */
export interface SignedFileUrl {
	url: string
	/** null với file public (không hết hạn) */
	expiresAt: string | null
}

/** Kết quả xin link upload thẳng lên R2 (file private) */
export interface PresignedUpload {
	attachmentId: string
	uploadUrl: string
	/** Header bắt buộc gửi kèm khi PUT (đã được ký) */
	headers: Record<string, string>
	expiresAt: string
}

export interface UploadAttachmentParams {
	file: File
	storagePath?: string
}
