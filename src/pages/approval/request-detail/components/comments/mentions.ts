import type { ApprovalRequestDetail, UserBrief } from "#src/api/approval-request";
import { PrincipalType } from "#src/api/system/principal/types";

/**
 * Người có thể @mention, lấy từ chi tiết tờ trình: người trình, người duyệt / người xử lý / người được ủy quyền
 * ở các vòng, người được chia sẻ, và `groupMembers` (thành viên các nhóm duyệt / nhóm được chia sẻ, xem `mentionGroupIds`).
 * Không rộng hơn phạm vi backend — chọn từ danh sách này backend sẽ không từ chối.
 */
export function mentionCandidates(detail: Pick<ApprovalRequestDetail, "requester" | "tasks" | "shares">, excludeUserId?: string, groupMembers: UserBrief[] = []): UserBrief[] {
	const byId = new Map<string, UserBrief>();
	const add = (user?: UserBrief | null) => {
		if (user && user.id !== excludeUserId && !byId.has(user.id))
			byId.set(user.id, { id: user.id, fullName: user.fullName, avatar: user.avatar });
	};
	add(detail.requester);
	for (const task of detail.tasks) {
		add(task.approver.user);
		add(task.originApprover.user);
		add(task.actedBy);
		task.delegates?.forEach(add);
	}
	for (const share of detail.shares ?? [])
		add(share.principal.user);
	groupMembers.forEach(add);
	return [...byId.values()];
}

/** Id các nhóm có mặt trong tờ trình (nhóm duyệt theo quy trình, nhóm được chia sẻ) — để tải thành viên cho @mention */
export function mentionGroupIds(detail: Pick<ApprovalRequestDetail, "tasks" | "shares">): string[] {
	const ids = new Set<string>();
	for (const task of detail.tasks) {
		if (task.originApprover.type === PrincipalType.Group)
			ids.add(task.originApprover.id);
	}
	for (const share of detail.shares ?? []) {
		if (share.principal.type === PrincipalType.Group)
			ids.add(share.principal.id);
	}
	return [...ids];
}

/** Bỏ dấu + chữ thường để lọc không phân biệt dấu ("nguyen" khớp "Nguyễn") */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();

/** Tên có khớp từ khóa đang gõ sau "@" không (không phân biệt hoa thường và dấu; từ khóa trống = khớp hết) */
export function matchesMention(fullName: string, query: string): boolean {
	return fold(fullName).includes(fold(query.trim()));
}

export interface MentionSegment {
	text: string
	/** Đoạn này là "@Họ tên" của một người được nhắc */
	mention: boolean
}

/** Tách nội dung thành đoạn thường / đoạn @mention để tô nổi; tên dài khớp trước để "@An Nguyễn" không bị cắt thành "@An" */
export function splitMentions(content: string, mentions: Pick<UserBrief, "fullName">[]): MentionSegment[] {
	const names = [...new Set(mentions.map(user => user.fullName).filter(Boolean))].sort((a, b) => b.length - a.length);
	if (!names.length)
		return [{ text: content, mention: false }];
	const escaped = names.map(name => `@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
	const parts = content.split(new RegExp(`(${escaped.join("|")})`, "g"));
	return parts.filter(Boolean).map(text => ({ text, mention: text.startsWith("@") && names.includes(text.slice(1)) }));
}

export const COMMENT_MAX_LENGTH = 2000;

/**
 * Cấu hình cụm @mention: tô màu, văn bản là "@tên", và Backspace sau cụm xóa cả cụm
 * (mặc định tiptap chỉ đổi cụm về chữ "@" để gõ lại gợi ý).
 */
export const COMMENT_MENTION_OPTIONS = {
	HTMLAttributes: { class: "comment-mention" },
	deleteTriggerWithBackspace: true,
	renderText: ({ node }: { node: { attrs: Record<string, unknown> } }) => `@${String(node.attrs.label ?? node.attrs.id)}`,
	renderHTML: ({ node, options }: { node: { attrs: Record<string, unknown> }, options: { HTMLAttributes: Record<string, unknown> } }) =>
		["span", options.HTMLAttributes, `@${String(node.attrs.label ?? node.attrs.id)}`] as const,
};
