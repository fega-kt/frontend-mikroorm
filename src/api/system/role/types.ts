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

	/** ===== FORM ===== */

	MenuForm = "permission:menu:form",
	ViewFormDetail = "permission:form:view",
	CreateForm = "permission:form:create",
	UpdateForm = "permission:form:update",
	DeleteForm = "permission:form:delete",

	/** ===== APPROVAL WORKFLOW ===== */

	/** vào menu quy trình phê duyệt (danh sách + thiết kế) */
	MenuApprovalWorkflow = "permission:menu:approval-workflow",

	/** tạo quy trình phê duyệt */
	CreateApprovalWorkflow = "permission:approval-workflow:create",

	/** sửa thông tin + lưu bản nháp quy trình */
	UpdateApprovalWorkflow = "permission:approval-workflow:update",

	/** xuất bản phiên bản quy trình */
	PublishApprovalWorkflow = "permission:approval-workflow:publish",

	/** xóa quy trình phê duyệt */
	DeleteApprovalWorkflow = "permission:approval-workflow:delete",

	/** ===== EMAIL TEMPLATE ===== */

	/** vào menu mẫu email */
	MenuEmailTemplate = "permission:menu:email-template",

	/** tạo / sửa / xoá mẫu email, khôi phục mẫu hệ thống */
	UpdateEmailTemplate = "permission:email-template:update",

	/** ===== APPROVAL REQUEST (quản trị) ===== */

	/** vào menu tất cả đơn + xem chi tiết mọi đơn */
	MenuAllApprovalRequest = "permission:menu:approval-request-all",

	/** gán lại người duyệt của bước đang chờ */
	ReassignApprovalTask = "permission:approval-task:reassign",

	/** tạo ủy quyền hộ người khác (vd: HR cho giám đốc), xem / sửa / xóa mọi ủy quyền */
	ManageApprovalDelegation = "permission:approval-delegation:manage",

	/** ===== APP SETTING ===== */

	MenuAppSetting = "permission:menu:app-setting",
	ViewAppSettingDetail = "permission:app-setting:view",
	CreateAppSetting = "permission:app-setting:create",
	UpdateAppSetting = "permission:app-setting:update",
	DeleteAppSetting = "permission:app-setting:delete",

	/** ===== ACTIVITY LOG QUEUE (hàng đợi gửi mail) ===== */

	/** xem hàng đợi gửi mail (menu Theo dõi hoạt động → Hàng đợi gửi mail) */
	ViewActivityLogQueue = "permission:activity-log-queue:view",

	/** gửi lại email trong hàng đợi */
	RetryActivityLogQueue = "permission:activity-log-queue:retry",

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
