import type { CategoryEntity, CategorySearchParams } from "./types";
import { CrudServiceBase } from "../../service-base";

export * from "./types";

export class CategoryService extends CrudServiceBase<CategoryEntity> {
	constructor() {
		super({ endpoint: "category", populate: ["department"] });
	}

	async fetchCategoryList(params?: CategorySearchParams) {
		return this.get<{ data: CategoryEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	async fetchCategoryItem(id: string) {
		return this.get<CategoryEntity>(id, { ignoreLoading: true });
	}

	async fetchAddCategory(data: Partial<CategoryEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateCategory(id: string, data: Partial<CategoryEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	async fetchDeleteCategory(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}
}

export const categoryService = new CategoryService();
