import type { SectionEntity } from "./types";
import { CrudServiceBase } from "../service-base";

export class SectionService extends CrudServiceBase<SectionEntity> {
	constructor() {
		super({ endpoint: "project" });
	}

	/** GET /project/:projectId/sections */
	async fetchSectionsByProject(projectId: string) {
		return this.get<{ data: SectionEntity[], total: number }>(`${projectId}/sections`, {
			ignoreLoading: true,
		});
	}

	/** POST /project/:projectId/sections — body: { name } */
	async fetchCreateSection(projectId: string, name: string) {
		return this.post<SectionEntity>(`${projectId}/sections`, {
			json: { name },
			ignoreLoading: true,
		});
	}

	/** PATCH /project/:projectId/sections/:id — body: { name? } */
	async fetchUpdateSection(projectId: string, id: string, data: { name?: string }) {
		return this.patch<void>(`${projectId}/sections/${id}`, {
			json: data,
			ignoreLoading: true,
		});
	}

	/** DELETE /project/:projectId/sections/:id */
	async fetchDeleteSection(projectId: string, id: string) {
		return this.delete<void>(`${projectId}/sections/${id}`, {
			ignoreLoading: true,
		});
	}

	/** PATCH /project/:projectId/sections/reorder — body: { orders: [{ id, order }] } */
	async fetchReorderSections(projectId: string, orders: Array<{ id: string, order: number }>) {
		return this.patch<void>(`${projectId}/sections/reorder`, {
			json: { orders },
			ignoreLoading: true,
		});
	}
}

export const sectionService = new SectionService();
