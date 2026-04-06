import type { ProjectEntity } from "./types";
import { CrudServiceBase } from "../service-base";

export class ProjectService extends CrudServiceBase<ProjectEntity> {
	constructor() {
		super({ endpoint: "project", populate: ["owner"] });
	}

	/** Lấy danh sách dự án có phân trang */
	async fetchProjectList(params?: any) {
		return this.get<{ data: ProjectEntity[], total: number }>("", {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** Lấy chi tiết dự án */
	async fetchProjectDetail(id: string) {
		return this.get<ProjectEntity>(id, { ignoreLoading: true });
	}

	/** Tạo mới dự án */
	async fetchCreateProject(data: Partial<ProjectEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Cập nhật dự án */
	async fetchUpdateProject(id: string, data: Partial<ProjectEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa dự án */
	async fetchDeleteProject(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const projectService = new ProjectService();
