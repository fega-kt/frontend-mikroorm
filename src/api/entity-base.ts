import type { UserEntity } from "./user";

type User = Pick<
	UserEntity,
  "id" | "avatar" | "loginName" | "workEmail" | "phoneNumber"
>;

export interface EntityBase {
	id: string
	created: Date
	createdBy: User
	updatedAt: Date
	updatedBy: User
	deleted: boolean
}
