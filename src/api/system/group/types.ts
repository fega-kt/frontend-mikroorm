import type { EntityBase } from "../../entity-base";
import type { UserEntity } from "../../user/types";

import type { PrincipalEntity } from "../principal/types";

export interface GroupEntity extends EntityBase {
	name: string
	principal?: PrincipalEntity
	users?: UserEntity[]
	description?: string
}

export interface GroupSearchParams {
	current?: number
	pageSize?: number
	name?: string
	keyword?: string
}
