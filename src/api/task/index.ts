import type { TaskEntity } from "./types";
import { CrudServiceBase } from "../service-base";

export class TaskService extends CrudServiceBase<TaskEntity> {
	constructor() {
		super({ endpoint: "task", populate: ["assignee", "project"] });
	}

	/** Lấy danh sách task có phân trang */
	async fetchTaskList(params?: any) {
		return this.get<{ data: TaskEntity[], total: number }>("", {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** Lấy chi tiết task */
	async fetchTaskDetail(id: string) {
		return this.get<TaskEntity>(id, { ignoreLoading: true });
	}

	/** Tạo mới task */
	async fetchCreateTask(data: Partial<TaskEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Cập nhật task */
	async fetchUpdateTask(id: string, data: Partial<TaskEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa task */
	async fetchDeleteTask(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const taskService = new TaskService();
