import type { CommentEntity, CommentPayload } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class CommentService extends CrudServiceBase<CommentEntity> {
	constructor() {
		super({ endpoint: "comment", populate: ["task", "parentComment"] });
	}

	/** GET /comment/by-task/:taskId */
	async fetchCommentsByTask(taskId: string, params?: Record<string, any>) {
		return this.get<{ data: CommentEntity[], total: number }>(`by-task/${taskId}`, {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** POST /comment */
	async fetchCreateComment(data: CommentPayload) {
		return this.post<CommentEntity>("", { json: data, ignoreLoading: true });
	}

	/** PATCH /comment/:id */
	async fetchUpdateComment(id: string, data: Pick<CommentPayload, "content">) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** DELETE /comment/:id */
	async fetchDeleteComment(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const commentService = new CommentService();
