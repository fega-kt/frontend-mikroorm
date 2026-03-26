export interface UserInDept {
	id: number
	fullName: string
	loginName: string
}

export interface DeptItemType {
	id: number
	code: string
	name: string
	parentId?: number
	parentCode?: string
	status: 1 | 0
	users?: UserInDept[]
	createTime: number
	updateTime: number
}
