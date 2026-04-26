import type { EntityBase } from "../entity-base";

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
}

export interface ActivityLogEntity extends EntityBase {
	parentId: string
	action: ActivityLogAction
	oldData?: Record<string, any>
	newData?: Record<string, any>
	type: ActivityLogType
	ip: string
	device: string
}
