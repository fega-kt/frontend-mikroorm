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
	FORM: [
		PermissionType.MenuForm,
		PermissionType.ViewFormDetail,
		PermissionType.CreateForm,
		PermissionType.UpdateForm,
		PermissionType.DeleteForm,
	],
	APPROVAL_WORKFLOW: [
		PermissionType.MenuApprovalWorkflow,
		PermissionType.CreateApprovalWorkflow,
		PermissionType.UpdateApprovalWorkflow,
		PermissionType.PublishApprovalWorkflow,
		PermissionType.DeleteApprovalWorkflow,
	],
	EMAIL_TEMPLATE: [
		PermissionType.MenuEmailTemplate,
		PermissionType.UpdateEmailTemplate,
	],
	I18N: [
		PermissionType.MenuI18n,
		PermissionType.UpdateI18n,
	],
	APPROVAL_REQUEST: [
		PermissionType.MenuAllApprovalRequest,
		PermissionType.ReassignApprovalTask,
		PermissionType.ManageApprovalDelegation,
	],
	// Chứng thư ký số thuộc core (dùng chung cho mọi nghiệp vụ ký), không riêng tờ trình
	SIGNING_CERTIFICATE: [
		PermissionType.ManageSigningCertificate,
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
	ACTIVITY_LOG_QUEUE: [
		PermissionType.ViewActivityLogQueue,
		PermissionType.RetryActivityLogQueue,
	],
};
