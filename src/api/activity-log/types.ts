import type { EntityBase } from "../entity-base";

/** Ai thực hiện thao tác: người dùng qua API hay hệ thống (job, cron) */
export enum ActivityLogType {
	System = "system",
	User = "user",
}

export enum ActivityLogAction {
	CREATE = "CREATE",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
	RESTORE = "RESTORE",
	STATUS_CHANGE = "STATUS_CHANGE",
	ASSIGN = "ASSIGN",
	APPROVE = "APPROVE",
	REJECT = "REJECT",
	CHANGE_PASSWORD = "CHANGE_PASSWORD",
	FORGOT_PASSWORD = "FORGOT_PASSWORD",
}

/** Tên bảng mà parentId trỏ tới (backend lấy từ tableName của entity) */
export enum ActivityLogParentType {
	Users = "users",
	Departments = "departments",
	Groups = "groups",
	Roles = "roles",
	AppSettings = "app_settings",
	/** Log không gắn với bảng cụ thể, hoặc tạo trước khi có cột parentType */
	Unknown = "unknown",
}

export interface ActivityLogEntity extends EntityBase {
	parentId: string
	parentType: ActivityLogParentType | (string & {})
	action: ActivityLogAction
	oldData?: Record<string, any>
	newData?: Record<string, any>
	type: ActivityLogType
	ip: string
	device: string
	/** id của request đã tạo log, dùng để tra log server */
	requestId: string
}
