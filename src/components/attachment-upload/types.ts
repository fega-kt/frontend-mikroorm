import type { AttachmentEntity } from "#src/api/attachment";

export type { AttachmentEntity };

export interface AttachmentUploadRef {
	/**
	 * Upload tất cả file đang ở trạng thái pending (dùng ở manual mode).
	 * Trả về danh sách AttachmentEntity đầy đủ sau khi sync xong.
	 */
	sync: () => Promise<AttachmentEntity[]>
}

export interface AttachmentUploadProps {
	/** Danh sách attachment đã upload (controlled) */
	value?: AttachmentEntity[]
	onChange?: (value: AttachmentEntity[]) => void
	/**
	 * `auto`   – upload ngay khi chọn file (default)
	 * `manual` – chỉ upload khi gọi ref.sync()
	 */
	mode?: "auto" | "manual"
	/** storagePath gửi kèm lên backend */
	storagePath?: string
	multiple?: boolean
	/** Chuỗi accept của <input type="file"> */
	accept?: string
	/** Giới hạn số lượng file (đã upload + đang pending) */
	maxCount?: number
	/** Giới hạn dung lượng mỗi file (bytes). Default: 10 MB */
	maxSize?: number
	disabled?: boolean
}

/** Trạng thái nội bộ của file chưa hoàn thành upload */
export type PendingStatus = "pending" | "uploading" | "error";

export interface PendingItem {
	uid: string
	file: File
	status: PendingStatus
	error?: string
}
