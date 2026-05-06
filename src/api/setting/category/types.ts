import type { EntityBase } from "#src/api/entity-base.js";
import type { DepartmentEntity } from "#src/api/system/dept";

export interface CategorySearchParams {
	current?: number
	pageSize?: number
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
