import type { AttachmentEntity, PresignedUpload, UploadAttachmentParams } from "./types";

import { ApiService, CrudServiceBase } from "../service-base";

/** PUT file thẳng lên R2 qua link ký; dùng XHR để có tiến trình upload (fetch/ky không có) */
function putToStorage(target: PresignedUpload, file: File, onProgress?: (percent: number) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", target.uploadUrl);
		for (const [name, value] of Object.entries(target.headers))
			xhr.setRequestHeader(name, value);
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable)
				onProgress?.(Math.round((event.loaded / event.total) * 100));
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300)
				resolve();
			else
				reject(new Error(`Upload thất bại (${xhr.status})`));
		};
		// Thường do mạng hoặc chưa cấu hình CORS cho bucket
		xhr.onerror = () => reject(new Error("Không thể tải file lên kho lưu trữ. Vui lòng kiểm tra kết nối và thử lại."));
		xhr.send(file);
	});
}

export * from "./types";

export class AttachmentService extends CrudServiceBase<AttachmentEntity> {
	constructor() {
		super({ endpoint: "attachment", service: ApiService.Core });
	}

	/**
	 * Upload thẳng lên R2 bằng link ký do nghiệp vụ sở hữu file cấp (`presign`), hỗ trợ file lớn và có tiến trình.
	 * Xong bước PUT, backend kiểm file thật trên R2 rồi mới cho dùng.
	 */
	async uploadWithPresign({ file, presign, onProgress }: { file: File, presign: (file: File) => Promise<PresignedUpload>, onProgress?: (percent: number) => void }): Promise<AttachmentEntity> {
		const target = await presign(file);
		await putToStorage(target, file, onProgress);
		return this.post<AttachmentEntity>(`${target.attachmentId}/complete`, { ignoreLoading: true });
	}

	/** Upload một file qua backend (multipart), trả về AttachmentEntity */
	upload({ file, storagePath }: UploadAttachmentParams): Promise<AttachmentEntity> {
		const formData = new FormData();
		formData.append("file", file);
		if (storagePath) {
			formData.append("path", storagePath);
		}
		return this.post<AttachmentEntity>("", { body: formData });
	}

	/** Xóa attachment theo id */
	remove(id: string): Promise<void> {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const attachmentService = new AttachmentService();
