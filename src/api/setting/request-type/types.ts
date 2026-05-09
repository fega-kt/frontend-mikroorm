import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { CategoryEntity } from "#src/api/setting/category";

export enum RequestTypeStatus {
	Draft = "draft",
	Published = "published",
	Cancelled = "cancelled",
}

export interface RequestTypeSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	code?: string
	keyword?: string
	status?: RequestTypeStatus
}

export interface RequestTypeEntity extends EntityBase {
	code: string
	name: string
	category: CategoryEntity
	prefix: string
	description?: string
	status: RequestTypeStatus
}
