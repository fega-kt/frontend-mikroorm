import type { AttachmentEntity, PresignedUpload } from "#src/api/attachment";

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
	/** storagePath gửi kèm lên backend (upload qua backend, dùng cho file public) */
	storagePath?: string
	/** Bấm xem một tệp đã upload: tệp private không có URL công khai nên nơi dùng mở trình xem (FileViewer) */
	onViewFile?: (file: AttachmentEntity) => void
	/** Bấm tải một tệp đã upload: có thì hiện nút tải (nút quay trong lúc promise chưa xong) */
	onDownloadFile?: (file: AttachmentEntity) => Promise<void>
	/** Tải bản PDF của tệp Word / Excel / PowerPoint: có thì các tệp đó có thêm nút PDF cạnh nút tải tệp gốc */
	onDownloadPdfFile?: (file: AttachmentEntity) => Promise<void>
	/** Xin link upload thẳng lên R2 (file private): có thì upload bằng link ký thay vì qua backend */
	presign?: (file: File) => Promise<PresignedUpload>
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
	/** Tiến trình upload 0–100 (chỉ có khi upload thẳng lên R2) */
	progress?: number
	error?: string
}
