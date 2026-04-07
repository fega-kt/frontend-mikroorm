import type { ProjectEntity, ProjectPayload } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

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
	async fetchCreateProject(data: ProjectPayload) {
		return this.post<ProjectEntity>("", { json: data, ignoreLoading: true });
	}

	/** Cập nhật dự án */
	async fetchUpdateProject(id: string, data: ProjectPayload) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa dự án */
	async fetchDeleteProject(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const projectService = new ProjectService();
