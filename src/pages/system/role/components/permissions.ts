import { PermissionType } from "#src/api/system/role/types";

/** Map of categories and their respective permission keys */
export const PERMISSION_GROUPS: Record<string, PermissionType[]> = {
	USER: [
		PermissionType.MenuUser,
		PermissionType.ViewUserDetail,
		PermissionType.CreateUser,
		PermissionType.UpdateUser,
		PermissionType.DeleteUser,
	],
	ROLE: [
		PermissionType.MenuRole,
		PermissionType.ViewRoleDetail,
		PermissionType.CreateRole,
		PermissionType.UpdateRole,
		PermissionType.DeleteRole,
	],
	DEPARTMENT: [
		PermissionType.MenuDeparment,
		PermissionType.ViewDeparmentDetail,
		PermissionType.CreateDeparment,
		PermissionType.UpdateDeparment,
		PermissionType.DeleteDeparment,
	],
	GROUP: [
		PermissionType.MenuGroup,
		PermissionType.ViewGroupDetail,
		PermissionType.CreateGroup,
		PermissionType.UpdateGroup,
		PermissionType.DeleteGroup,
	],
	CATEGORY: [
		PermissionType.MenuCategory,
		PermissionType.ViewCategoryDetail,
		PermissionType.CreateCategory,
		PermissionType.UpdateCategory,
		PermissionType.DeleteCategory,
	],
	REQUEST_TYPE: [
		PermissionType.MenuRequestType,
		PermissionType.ViewRequestTypeDetail,
		PermissionType.CreateRequestType,
		PermissionType.UpdateRequestType,
		PermissionType.DeleteRequestType,
	],
	APPROVAL_WORKFLOW: [
		PermissionType.MenuApprovalWorkflow,
		PermissionType.CreateApprovalWorkflow,
		PermissionType.UpdateApprovalWorkflow,
		PermissionType.PublishApprovalWorkflow,
		PermissionType.DeleteApprovalWorkflow,
	],
	APPROVAL_REQUEST: [
		PermissionType.MenuAllApprovalRequest,
		PermissionType.ReassignApprovalTask,
	],
	APP_SETTING: [
		PermissionType.MenuAppSetting,
		PermissionType.ViewAppSettingDetail,
		PermissionType.CreateAppSetting,
		PermissionType.UpdateAppSetting,
		PermissionType.DeleteAppSetting,
	],
	ACTIVITY_LOG: [
		PermissionType.MenuActivityLog,
		PermissionType.ViewActivityLogAll,
		PermissionType.ViewActivityLogDepartment,
	],
};
