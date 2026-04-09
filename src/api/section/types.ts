import type { EntityBase } from "../entity-base";
import type { ProjectEntity } from "../project/types";

export interface SectionEntity extends EntityBase {
	name: string
	project: ProjectEntity
	order: number
}
