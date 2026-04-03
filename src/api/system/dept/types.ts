import type { EntityBase } from "#src/api/entity-base.js";
import type { UserEntity } from "../../user";

export interface DepartmentEntity extends EntityBase {
	code: string
	name: string
	status: 1 | 0
	parent?: DepartmentEntity
	manager?: UserEntity | null
	deputy?: UserEntity | null
	users?: UserEntity[]
}
