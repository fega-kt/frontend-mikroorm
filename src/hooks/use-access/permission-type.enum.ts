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
}
