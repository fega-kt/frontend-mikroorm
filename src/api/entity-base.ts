import type { UserEntity } from "./user";

type User = Pick<
	UserEntity,
  "id" | "avatar" | "loginName" | "workEmail" | "phoneNumber"
>;

export interface EntityBase {
	id: string
	createdAt: Date
	createdBy: User
	updatedAt: Date
	updatedBy: User
	deleted: boolean
}
