import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { UserEntity } from "../../user";

export interface DepartmentSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	code?: string
	status?: 0 | 1
	keyword?: string
}

export interface DepartmentUsersSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	keyword?: string
}

export interface DepartmentEntity extends EntityBase {
	code: string
	name: string
	status: 1 | 0
	parent?: DepartmentEntity
	manager?: UserEntity | null
	deputy?: UserEntity | null
}

export type DepartmentTreeNode = WithChildren<{
	id: string
	name: string
	code: string
	parentCode: string
	status: 1 | 0
	createdAt: Date
	createdBy?: Pick<UserEntity, "id" | "fullName" | "avatar" | "loginName" | "workEmail" | "phoneNumber">
	updatedAt?: Date
	updatedBy?: Pick<UserEntity, "id" | "fullName" | "avatar" | "loginName" | "workEmail" | "phoneNumber">
	parent: string
}, "children">;
