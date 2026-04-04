import type { EntityBase } from "../../entity-base";

export enum PermissionType {
	/** ===== USER ===== */
	MenuUser = "permission:menu:user",
	ViewUserDetail = "permission:user:view",
	CreateUser = "permission:user:create",
	UpdateUser = "permission:user:update",
	DeleteUser = "permission:user:delete",

	/** ===== ROLE ===== */
	MenuRole = "permission:menu:role",
	ViewRoleDetail = "permission:role:view",
	CreateRole = "permission:role:create",
	UpdateRole = "permission:role:update",
	DeleteRole = "permission:role:delete",

	/** ===== DEPARTMENT ===== */
	MenuDeparment = "permission:menu:department",
	ViewDeparmentDetail = "permission:department:view",
	CreateDeparment = "permission:department:create",
	UpdateDeparment = "permission:department:update",
	DeleteDeparment = "permission:department:delete",

	/** ===== PROJECT ===== */
	MenuProject = "permission:menu:project",
	ViewProjectDetail = "permission:project:view",
	CreateProject = "permission:project:create",
	UpdateProject = "permission:project:update",
	DeleteProject = "permission:project:delete",

	/** ===== TASK ===== */
	MenuTask = "permission:menu:task",
	ViewTaskDetail = "permission:task:view",
	CreateTask = "permission:task:create",
	UpdateTask = "permission:task:update",
	DeleteTask = "permission:task:delete",
	AssignTask = "permission:task:assign",
}

export interface RoleSearchParams {
	current?: number
	pageSize?: number
	name?: string
	keyword?: string
}

export interface RoleEntity extends EntityBase {
	name: string
	description?: string
	rights: PermissionType[]
	usersAndGroups?: any[]
}
