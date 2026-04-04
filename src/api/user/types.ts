import type { AppRouteRecordRaw } from "#src/router/types";
import type { EntityBase } from "../entity-base";
import type { DepartmentEntity } from "../system/dept/types";

export interface AuthType {
	token: string
	refreshToken: string
}

export interface LoginInfo {
	username: string
	password: string
}

export interface UserSearchParams {
	current?: number
	pageSize?: number
	fullName?: string
	loginName?: string
	workEmail?: string
	phoneNumber?: string
	status?: 0 | 1
	keyword?: string
}

export interface UserEntity extends EntityBase {
	avatar: string
	loginName: string
	fullName: string
	workEmail: string
	phoneNumber?: string
	description: string
	permissions: Array<string>
	status: 0 | 1
	department?: DepartmentEntity | null
	role?: string
	password?: string
	// 路由可以在此处动态添加
	menus?: AppRouteRecordRaw[]
}

export interface AuthListProps {
	label: string
	name: string
	auth: string[]
}
