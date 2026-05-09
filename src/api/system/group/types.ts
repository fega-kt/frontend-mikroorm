import type { EntityBase } from "../../entity-base";
import type { SearchParamsBase } from "../../service-base";
import type { UserEntity } from "../../user/types";

import type { PrincipalEntity } from "../principal/types";

export interface GroupEntity extends EntityBase {
	name: string
	principal?: PrincipalEntity
	users?: UserEntity[]
	description?: string
}

export interface GroupSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	keyword?: string
}
