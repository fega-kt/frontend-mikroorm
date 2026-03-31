import type { UserInfoType } from "./user";

type User = Pick<
	UserInfoType,
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
