import type { ApprovalRequestDetail, UserBrief } from "#src/api/approval-request";
import { matchesMention, mentionCandidates, splitMentions } from "#src/pages/approval/request-detail/components/comments/mentions";
import { describe, expect, it } from "vitest";

const user = (id: string, fullName: string): UserBrief => ({ id, fullName });
const principal = (u: UserBrief | null, name = "Nhóm") => ({ id: `p-${u?.id ?? name}`, type: u ? "user" : "group", name: u?.fullName ?? name, user: u });

describe("mentionCandidates", () => {
	const detail = {
		requester: user("r", "Người trình"),
		tasks: [
			{ approver: principal(user("a", "Duyệt A")), originApprover: principal(user("o", "Gốc O")), actedBy: user("a", "Duyệt A"), delegates: [user("d", "Ủy quyền D")] },
			{ approver: principal(null), originApprover: principal(null), actedBy: null, delegates: [] },
		],
		shares: [{ principal: principal(user("s", "Chia sẻ S")) }, { principal: principal(null) }],
	} as unknown as Pick<ApprovalRequestDetail, "requester" | "tasks" | "shares">;

	it("collects requester, approvers, delegates and shared users once, without groups", () => {
		expect(mentionCandidates(detail).map(u => u.id).sort()).toEqual(["a", "d", "o", "r", "s"]);
	});

	it("leaves the current user out", () => {
		expect(mentionCandidates(detail, "r").map(u => u.id)).not.toContain("r");
	});
});

describe("matchesMention", () => {
	it("ignores case and accents", () => {
		expect(matchesMention("Nguyễn Văn Đức", "nguyen")).toBe(true);
		expect(matchesMention("Nguyễn Văn Đức", "duc")).toBe(true);
		expect(matchesMention("Nguyễn Văn Đức", "VĂN ĐỨ")).toBe(true);
	});

	it("matches inside the name and with an empty query", () => {
		expect(matchesMention("Trần Bình", "bình")).toBe(true);
		expect(matchesMention("Trần Bình", "")).toBe(true);
		expect(matchesMention("Trần Bình", "  ")).toBe(true);
	});

	it("rejects names that do not contain the query", () => {
		expect(matchesMention("Trần Bình", "lan")).toBe(false);
	});
});

describe("splitMentions", () => {
	it("returns the whole text when nobody is mentioned", () => {
		expect(splitMentions("Xin chào", [])).toEqual([{ text: "Xin chào", mention: false }]);
	});

	it("marks @mentions and keeps the text around them", () => {
		expect(splitMentions("Nhờ @Trần Bình xem", [user("2", "Trần Bình")])).toEqual([
			{ text: "Nhờ ", mention: false },
			{ text: "@Trần Bình", mention: true },
			{ text: " xem", mention: false },
		]);
	});

	it("prefers the longer name and escapes regex characters", () => {
		const segments = splitMentions("@An Nguyễn và @A.B", [user("1", "An"), user("2", "An Nguyễn"), user("3", "A.B")]);
		expect(segments.filter(s => s.mention).map(s => s.text)).toEqual(["@An Nguyễn", "@A.B"]);
	});
});
