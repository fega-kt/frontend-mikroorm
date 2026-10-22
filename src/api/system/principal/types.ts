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

export interface PersonCardUser {
	id: string
	fullName: string
	loginName: string
	avatar?: string
	workEmail?: string
	department: { id: string, name: string } | null
}

export interface PersonCardProfile extends PersonCardUser {
	phoneNumber?: string
	lastActiveAt?: string | null
	isActive: boolean
	/** Tối đa 3 nhóm (backend giới hạn), groupTotal là tổng */
	groups: { id: string, name: string }[]
	groupTotal: number
}

export interface PersonCard {
	principalId?: string
	type: PrincipalType
	name: string
	description?: string
	user?: PersonCardProfile
	members?: PersonCardUser[]
	memberTotal?: number
}
