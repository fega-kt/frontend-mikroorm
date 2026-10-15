import type { AttachmentEntity, MultipartUpload, PresignedUpload, UploadAttachmentParams, UploadedPart } from "./types";

import { PART_ATTEMPTS, PART_CONCURRENCY } from "#src/constants/upload";

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

/** PUT một phần lên R2; trả về ETag (cần để ghép phần). Cần CORS của bucket cho phép đọc header ETag */
function putPart(url: string, blob: Blob, onProgress: (loaded: number) => void): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.upload.onprogress = event => onProgress(event.loaded);
		xhr.onload = () => {
			if (xhr.status < 200 || xhr.status >= 300)
				return reject(new Error(`Upload thất bại (${xhr.status})`));
			const etag = xhr.getResponseHeader("ETag");
			// Thiếu ETag thường do bucket chưa cấu hình ExposeHeaders: ["ETag"] trong CORS
			if (etag)
				resolve(etag);
			else
				reject(new Error("Không đọc được ETag của phần đã upload (kiểm tra CORS của bucket)."));
		};
		xhr.onerror = () => reject(new Error("Không thể tải file lên kho lưu trữ. Vui lòng kiểm tra kết nối và thử lại."));
		xhr.send(blob);
	});
}

/** Upload file lớn theo từng phần, song song, thử lại riêng từng phần; tiến trình tính trên tổng dung lượng */
async function putMultipart(multipart: MultipartUpload, file: File, onProgress?: (percent: number) => void): Promise<UploadedPart[]> {
	const loadedByPart = new Map<number, number>();
	const report = () => {
		let loaded = 0;
		for (const value of loadedByPart.values())
			loaded += value;
		onProgress?.(Math.min(100, Math.round((loaded / file.size) * 100)));
	};

	const uploaded: UploadedPart[] = [];
	const queue = [...multipart.parts];
	const worker = async () => {
		for (let part = queue.shift(); part; part = queue.shift()) {
			const start = (part.partNumber - 1) * multipart.partSize;
			const blob = file.slice(start, Math.min(start + multipart.partSize, file.size));
			for (let attempt = 1; ; attempt++) {
				try {
					const etag = await putPart(part.url, blob, (loaded) => {
						loadedByPart.set(part.partNumber, loaded);
						report();
					});
					loadedByPart.set(part.partNumber, blob.size);
					report();
					uploaded.push({ partNumber: part.partNumber, etag });
					break;
				}
				catch (error) {
					loadedByPart.set(part.partNumber, 0);
					if (attempt >= PART_ATTEMPTS)
						throw error;
					await new Promise(resolve => setTimeout(resolve, 500 * attempt));
				}
			}
		}
	};
	// Một phần hết lượt thử thì dừng cả upload (các worker còn lại tự hết hàng đợi)
	await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, queue.length) }, worker).map(p => p.catch((error) => {
		queue.length = 0;
		throw error;
	})));
	return uploaded;
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
		if (target.multipart) {
			const parts = await putMultipart(target.multipart, file, onProgress);
			return this.post<AttachmentEntity>(`${target.attachmentId}/complete`, {
				json: { uploadId: target.multipart.uploadId, parts } as never,
				ignoreLoading: true,
			});
		}
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
