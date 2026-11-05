import type { ApprovalRequestDetail, UserBrief } from "#src/api/approval-request";

/**
 * Người có thể @mention, lấy từ chi tiết tờ trình: người trình, người duyệt / người xử lý / người được ủy quyền
 * ở các vòng, và người được chia sẻ (người dùng, không tính nhóm). Hẹp hơn phạm vi backend (thành viên nhóm không
 * hiện ở đây) nhưng không bao giờ rộng hơn — chọn từ danh sách này backend sẽ không từ chối.
 */
export function mentionCandidates(detail: Pick<ApprovalRequestDetail, "requester" | "tasks" | "shares">, excludeUserId?: string): UserBrief[] {
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
	return [...byId.values()];
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
