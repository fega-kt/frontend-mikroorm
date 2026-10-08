export enum PermissionType {
	/** ===== USER ===== */

	/** vào menu user */
	MenuUser = "permission:menu:user",

	/** xem chi tiết user */
	ViewUserDetail = "permission:user:view",

	/** tạo user */
	CreateUser = "permission:user:create",

	/** cập nhật user */
	UpdateUser = "permission:user:update",

	/** xóa user */
	DeleteUser = "permission:user:delete",

	/** ===== ROLE ===== */

	/** vào menu role */
	MenuRole = "permission:menu:role",

	/** xem chi tiết role */
	ViewRoleDetail = "permission:role:view",

	/** tạo role */
	CreateRole = "permission:role:create",

	/** cập nhật role */
	UpdateRole = "permission:role:update",

	/** xóa role */
	DeleteRole = "permission:role:delete",

	/** ===== DEPARTMENT ===== */

	/** vào menu department */
	MenuDeparment = "permission:menu:department",

	/** xem chi tiết department */
	ViewDeparmentDetail = "permission:department:view",

	/** tạo department */
	CreateDeparment = "permission:department:create",

	/** cập nhật department */
	UpdateDeparment = "permission:department:update",

	/** xóa department */
	DeleteDeparment = "permission:department:delete",

	/** ===== PROJECT ===== */

	/** vào menu project */
	MenuProject = "permission:menu:project",

	/** xem chi tiết project */
	ViewProjectDetail = "permission:project:view",

	/** tạo project */
	CreateProject = "permission:project:create",

	/** cập nhật project */
	UpdateProject = "permission:project:update",

	/** xóa project */
	DeleteProject = "permission:project:delete",

	/** ===== TASK ===== */

	/** vào menu task */
	MenuTask = "permission:menu:task",

	/** xem chi tiết task */
	ViewTaskDetail = "permission:task:view",

	/** tạo task */
	CreateTask = "permission:task:create",

	/** cập nhật task */
	UpdateTask = "permission:task:update",

	/** xóa task */
	DeleteTask = "permission:task:delete",

	/** phân công task */
	AssignTask = "permission:task:assign",

	/** ===== SECTION ===== */

	CreateSection = "permission:section:create",
	UpdateSection = "permission:section:update",
	DeleteSection = "permission:section:delete",

	/** ===== PROJECT MEMBER ===== */

	ViewProjectMember = "permission:project-member:view",
	AddProjectMember = "permission:project-member:add",
	UpdateProjectMember = "permission:project-member:update",
	RemoveProjectMember = "permission:project-member:remove",

	/** ===== SPRINT ===== */

	MenuSprint = "permission:menu:sprint",
	ViewSprintDetail = "permission:sprint:view",
	CreateSprint = "permission:sprint:create",
	UpdateSprint = "permission:sprint:update",
	DeleteSprint = "permission:sprint:delete",

	/** ===== MILESTONE ===== */

	MenuMilestone = "permission:menu:milestone",
	ViewMilestoneDetail = "permission:milestone:view",
	CreateMilestone = "permission:milestone:create",
	UpdateMilestone = "permission:milestone:update",
	DeleteMilestone = "permission:milestone:delete",

	/** ===== TIME LOG ===== */

	MenuTimeLog = "permission:menu:timelog",
	ViewTimeLog = "permission:timelog:view",
	CreateTimeLog = "permission:timelog:create",
	ApproveTimeLog = "permission:timelog:approve",
	DeleteTimeLog = "permission:timelog:delete",

	/** ===== COMMENT ===== */

	CreateComment = "permission:comment:create",
	UpdateComment = "permission:comment:update",
	DeleteComment = "permission:comment:delete",

	/** ===== GROUP ===== */

	MenuGroup = "permission:menu:group",
	ViewGroupDetail = "permission:group:view",
	CreateGroup = "permission:group:create",
	UpdateGroup = "permission:group:update",
	DeleteGroup = "permission:group:delete",

	/** ===== NOTIFICATION ===== */

	MenuNotification = "permission:menu:notification",

	/** ===== CATEGORY ===== */

	MenuCategory = "permission:menu:category",
	ViewCategoryDetail = "permission:category:view",
	CreateCategory = "permission:category:create",
	UpdateCategory = "permission:category:update",
	DeleteCategory = "permission:category:delete",

	/** ===== REQUEST TYPE ===== */

	/** vào menu request type */
	MenuRequestType = "permission:menu:request-type",

	/** xem chi tiết request type */
	ViewRequestTypeDetail = "permission:request-type:view",

	/** tạo request type */
	CreateRequestType = "permission:request-type:create",

	/** cập nhật request type */
	UpdateRequestType = "permission:request-type:update",

	/** xóa request type */
	DeleteRequestType = "permission:request-type:delete",

	/** ===== WORKFLOW SETTING ===== */

	/** vào menu workflow setting */
	MenuWorkflowSetting = "permission:menu:workflow-setting",

	/** xem chi tiết workflow setting */
	ViewWorkflowSettingDetail = "permission:workflow-setting:view",

	/** tạo workflow setting */
	CreateWorkflowSetting = "permission:workflow-setting:create",

	/** cập nhật workflow setting */
	UpdateWorkflowSetting = "permission:workflow-setting:update",

	/** xóa workflow setting */
	DeleteWorkflowSetting = "permission:workflow-setting:delete",

	/** deploy BPMN cho workflow setting */
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

	/** vào menu app setting */
	MenuAppSetting = "permission:menu:app-setting",

	/** xem chi tiết app setting */
	ViewAppSettingDetail = "permission:app-setting:view",

	/** thiết lập giá trị cho app setting chưa cấu hình */
	CreateAppSetting = "permission:app-setting:create",

	/** cập nhật app setting */
	UpdateAppSetting = "permission:app-setting:update",

	/** xóa giá trị app setting (về trạng thái chưa cấu hình) */
	DeleteAppSetting = "permission:app-setting:delete",
}
