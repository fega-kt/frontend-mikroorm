import type { EntityBase } from "../entity-base";

export interface AttachmentEntity extends EntityBase {
	/** Tên file gốc khi upload */
	filename: string
	/** MIME type của file (vd: image/png, application/pdf) */
	mimetype: string
	/** Dung lượng file tính bằng bytes */
	size: number
	/** Key lưu trên R2 storage (dùng để xóa hoặc tạo URL) */
	key: string
	/** URL công khai để truy cập file */
	url: string
	/** Thư mục lưu trữ trên R2 (phải thuộc STORAGE_PATH) */
	storagePath: string
}

export interface UploadAttachmentParams {
	file: File
	storagePath?: string
}
