import type { EntityBase } from "#src/api/entity-base.js";
import type { UserInfoType } from "../../user";

export interface DepartmentEntity extends EntityBase {
	code: string
	name: string
	status: 1 | 0
	parent?: DepartmentEntity
	users?: UserInfoType[]
}
