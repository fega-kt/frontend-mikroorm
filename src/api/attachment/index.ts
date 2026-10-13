import type { AttachmentEntity, DownloadDisposition, PresignedUpload, SignedFileUrl, UploadAttachmentParams } from "./types";

import { isPrivateStoragePath } from "#src/constants/storage-path";
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
	 * Upload một file, trả về AttachmentEntity. File private (vd: tệp tờ trình) đi thẳng lên R2 bằng link ký
	 * (hỗ trợ file lớn, có tiến trình); file public vẫn upload qua backend.
	 */
	async uploadFile(params: UploadAttachmentParams): Promise<AttachmentEntity> {
		if (!isPrivateStoragePath(params.storagePath))
			return this.upload(params);

		const { file, storagePath, onProgress } = params;
		const target = await this.post<PresignedUpload>("presign-upload", {
			json: { path: storagePath, filename: file.name, mimetype: file.type, size: file.size } as never,
			ignoreLoading: true,
		});
		await putToStorage(target, file, onProgress);
		// Backend kiểm file thật trên R2 rồi mới cho dùng
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

	/** Link xem/tải tạm thời cho file private do chính mình upload (vd: xem lại tệp chưa lưu vào tờ trình) */
	fetchDownloadUrl(id: string, disposition: DownloadDisposition = "attachment") {
		return this.get<SignedFileUrl>(`${id}/download-url`, { searchParams: { disposition }, ignoreLoading: true });
	}

	/** Xóa attachment theo id */
	remove(id: string): Promise<void> {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const attachmentService = new AttachmentService();
