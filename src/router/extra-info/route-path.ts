/**
 * 如果在其他地方用到了路由跳转，将路由的 path 抽离出来，在此方便维护
 * 防止修改 path 时忘记修改其他地方的 path
 */

export const loginPath = "/login";
export const healPath = "/health";

export const privacyPolicyPath = "/privacy-policy";
export const termsOfServicePath = "/terms-of-service";

export const exceptionPath = "/exception";
export const exception403Path = `${exceptionPath}/403`;
export const exception404Path = `${exceptionPath}/404`;
export const exception500Path = `${exceptionPath}/500`;
export const exceptionUnknownComponentPath = `${exceptionPath}/not-found-component`;

/** Đường dẫn phần duyệt tờ trình (menu do backend cấp, nên path được gom ở đây để đổi một chỗ là đủ) */
export enum ApprovalPath {
	Requests = "/approval/requests",
	MyDraft = "/approval/my/draft",
	MyAll = "/approval/my/all",
	ReviewPending = "/approval/review/pending",
}

export const approvalRequestPath = {
	create: `${ApprovalPath.Requests}/new`,
	detail: (id: string) => `${ApprovalPath.Requests}/${id}`,
	edit: (id: string) => `${ApprovalPath.Requests}/${id}/edit`,
};
