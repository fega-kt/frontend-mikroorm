import type { EntityBase } from "../../entity-base";
import type { SearchParamsBase } from "../../service-base";

export enum PermissionType {
	/** ===== USER ===== */
	MenuUser = "permission:menu:user",
	ViewUserDetail = "permission:user:view",
	CreateUser = "permission:user:create",
	UpdateUser = "permission:user:update",
	DeleteUser = "permission:user:delete",

	/** ===== ROLE ===== */
	MenuRole = "permission:menu:role",
	ViewRoleDetail = "permission:role:view",
	CreateRole = "permission:role:create",
	UpdateRole = "permission:role:update",
	DeleteRole = "permission:role:delete",

	/** ===== DEPARTMENT ===== */
	MenuDeparment = "permission:menu:department",
	ViewDeparmentDetail = "permission:department:view",
	CreateDeparment = "permission:department:create",
	UpdateDeparment = "permission:department:update",
	DeleteDeparment = "permission:department:delete",

	/** ===== PROJECT ===== */
	MenuProject = "permission:menu:project",
	ViewProjectDetail = "permission:project:view",
	CreateProject = "permission:project:create",
	UpdateProject = "permission:project:update",
	DeleteProject = "permission:project:delete",

	/** ===== TASK ===== */
	MenuTask = "permission:menu:task",
	ViewTaskDetail = "permission:task:view",
	CreateTask = "permission:task:create",
	UpdateTask = "permission:task:update",
	DeleteTask = "permission:task:delete",
	AssignTask = "permission:task:assign",

	/** ===== GROUP ===== */

	/** vào menu group */
	MenuGroup = "permission:menu:group",

	/** xem chi tiết group */
	ViewGroupDetail = "permission:group:view",

	/** tạo group */
	CreateGroup = "permission:group:create",

	/** cập nhật group */
	UpdateGroup = "permission:group:update",
	DeleteGroup = "permission:group:delete",

	/** ===== CATEGORY ===== */

	MenuCategory = "permission:menu:category",
	ViewCategoryDetail = "permission:category:view",
	CreateCategory = "permission:category:create",
	UpdateCategory = "permission:category:update",
	DeleteCategory = "permission:category:delete",

	/** ===== REQUEST TYPE ===== */

	MenuRequestType = "permission:menu:request-type",
	ViewRequestTypeDetail = "permission:request-type:view",
	CreateRequestType = "permission:request-type:create",
	UpdateRequestType = "permission:request-type:update",
	DeleteRequestType = "permission:request-type:delete",

	/** ===== WORKFLOW SETTING ===== */

	MenuWorkflowSetting = "permission:menu:workflow-setting",
	ViewWorkflowSettingDetail = "permission:workflow-setting:view",
	CreateWorkflowSetting = "permission:workflow-setting:create",
	UpdateWorkflowSetting = "permission:workflow-setting:update",
	DeleteWorkflowSetting = "permission:workflow-setting:delete",
	DeployWorkflowSetting = "permission:workflow-setting:deploy",

	/** ===== WORKFLOW INSTANCE ===== */

	MenuWorkflowInstance = "permission:menu:workflow-instance",
	ViewWorkflowInstanceDetail = "permission:workflow-instance:view",
	CreateWorkflowInstance = "permission:workflow-instance:create",
	UpdateWorkflowInstance = "permission:workflow-instance:update",
	CancelWorkflowInstance = "permission:workflow-instance:cancel",
	RequestToCancelWorkflowInstance = "permission:workflow-instance:request-to-cancel",
	ApproveCancellationWorkflowInstance = "permission:workflow-instance:approve-cancellation",
	RejectCancellationWorkflowInstance = "permission:workflow-instance:reject-cancellation",

	/** ===== WORKFLOW TASK ===== */

	MenuWorkflowTask = "permission:menu:workflow-task",
	ViewWorkflowTaskDetail = "permission:workflow-task:view",
	ApproveWorkflowTask = "permission:workflow-task:approve",
	RejectWorkflowTask = "permission:workflow-task:reject",
	ReturnWorkflowTask = "permission:workflow-task:return",
	RequestChangeWorkflowTask = "permission:workflow-task:request-change",
	ApplyChangeWorkflowTask = "permission:workflow-task:apply-change",
	RequestReviewWorkflowTask = "permission:workflow-task:request-review",
	SubmitReviewWorkflowTask = "permission:workflow-task:submit-review",

	/** ===== WORKFLOW DELEGATION SETTING ===== */

	MenuWorkflowDelegationSetting = "permission:menu:workflow-delegation-setting",
	ViewWorkflowDelegationSettingDetail = "permission:workflow-delegation-setting:view",
	CreateWorkflowDelegationSetting = "permission:workflow-delegation-setting:create",
	UpdateWorkflowDelegationSetting = "permission:workflow-delegation-setting:update",
	DeleteWorkflowDelegationSetting = "permission:workflow-delegation-setting:delete",

	/** ===== APP SETTING ===== */

	MenuAppSetting = "permission:menu:app-setting",
	ViewAppSettingDetail = "permission:app-setting:view",
	CreateAppSetting = "permission:app-setting:create",
	UpdateAppSetting = "permission:app-setting:update",
	DeleteAppSetting = "permission:app-setting:delete",

	/** ===== ACTIVITY LOG ===== */

	MenuActivityLog = "permission:menu:activity-log",
	/** xem activity log toàn hệ thống */
	ViewActivityLogAll = "permission:activity-log:view-all",
	/** xem activity log trong phòng ban của mình và các phòng ban con */
	ViewActivityLogDepartment = "permission:activity-log:view-department",
}

export interface RoleSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	keyword?: string
}

export interface RoleEntity extends EntityBase {
	name: string
	description?: string
	rights: PermissionType[]
	usersAndGroups?: any[]
}
