import type { EntityBase } from "../../entity-base";
import type { SearchParamsBase } from "../../service-base";
import type { UserEntity } from "../../user/types";
import type { GroupEntity } from "../group/types";

export enum PrincipalType {
	User = "user",
	Group = "group",
}

export interface PrincipalEntity extends EntityBase {
	name: string
	type?: PrincipalType
	group?: GroupEntity
	user?: UserEntity
	description?: string
}

export interface PrincipalSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	keyword?: string
}
