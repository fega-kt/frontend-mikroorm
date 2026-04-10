import type { TaskEntity, TaskPayload } from "./types";
import { CrudServiceBase } from "../service-base";

export class TaskService extends CrudServiceBase<TaskEntity> {
	constructor() {
		super({ endpoint: "task", populate: ["assignee", "project", "section", "parentTask"] });
	}

	/** Lấy danh sách task có phân trang (global) */
	async fetchTaskList(params?: any) {
		return this.get<{ data: TaskEntity[], total: number }>("", {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** Lấy danh sách task theo project — GET /task/by-project/:projectId */
	async fetchTasksByProject(projectId: string, params?: Record<string, any>) {
		return this.get<{ data: TaskEntity[], total: number }>(`by-project/${projectId}`, {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** Lấy subtask của một task — GET /task/:id/subtasks */
	async fetchSubtasks(parentTaskId: string) {
		return this.get<{ data: TaskEntity[], total: number }>(`${parentTaskId}/subtasks`, {
			ignoreLoading: true,
		});
	}

	/** Lấy chi tiết task */
	async fetchTaskDetail(id: string) {
		return this.get<TaskEntity>(id, { ignoreLoading: true });
	}

	/** Tạo mới task */
	async fetchCreateTask(data: TaskPayload) {
		return this.post<TaskEntity>("", { json: data, ignoreLoading: true });
	}

	/** Cập nhật task */
	async fetchUpdateTask(id: string, data: TaskPayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Chuyển task sang section khác — PATCH /task/:id/move */
	async fetchMoveTask(id: string, sectionId: string) {
		return this.patch<void>(`${id}/move`, {
			json: { sectionId },
			ignoreLoading: true,
		});
	}

	/** Cập nhật thứ tự tasks — PATCH /task/reorder */
	async fetchReorderTasks(orders: Array<{ id: string, order: number }>) {
		return this.patch<void>("reorder", { json: { orders }, ignoreLoading: true });
	}

	/** Xóa task */
	async fetchDeleteTask(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const taskService = new TaskService();
