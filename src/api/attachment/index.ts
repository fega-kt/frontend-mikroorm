import type { AttachmentEntity, UploadAttachmentParams } from "./types";

import { CrudServiceBase } from "../service-base";

export * from "./types";

export class AttachmentService extends CrudServiceBase<AttachmentEntity> {
	constructor() {
		super({ endpoint: "attachment" });
	}

	/** Upload một file lên R2, trả về AttachmentEntity */
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
