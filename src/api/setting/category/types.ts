import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { DepartmentEntity } from "#src/api/system/dept";

export interface CategorySearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	code?: string
	keyword?: string
}

export interface CategoryEntity extends EntityBase {
	department: DepartmentEntity
	code: string
	name: string
	icon?: string
}
