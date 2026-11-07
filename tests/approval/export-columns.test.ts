import { toExportLanguage, visibleExportColumns } from "#src/components/export-button/columns";
import { describe, expect, it } from "vitest";

const columns = [
	{ title: "Tìm kiếm" },
	{ key: "title", title: "Tiêu đề" },
	{ key: "requestType", title: "Loại tờ trình" },
	{ key: "actedAt", title: "Ngày xử lý" },
	{ key: "option", title: "Thao tác" },
];

const mapping = {
	title: ["code", "title"],
	requestType: ["requestType"],
	actedAt: ["taskStatus", "actedAt"],
};

describe("visibleExportColumns", () => {
	it("follows the table order, skips unmapped columns and uses the title only for single-key columns", () => {
		expect(visibleExportColumns(columns, {}, mapping)).toEqual([
			{ key: "code", header: undefined },
			{ key: "title", header: undefined },
			{ key: "requestType", header: "Loại tờ trình" },
			{ key: "taskStatus", header: undefined },
			{ key: "actedAt", header: undefined },
		]);
	});

	it("drops columns the user has hidden", () => {
		const result = visibleExportColumns(columns, { requestType: { show: false }, actedAt: { show: true } }, mapping);
		expect(result.map(column => column.key)).toEqual(["code", "title", "taskStatus", "actedAt"]);
	});

	it("never repeats a backend key", () => {
		const result = visibleExportColumns(
			[{ key: "a", title: "A" }, { key: "b", title: "B" }],
			{},
			{ a: ["code"], b: ["code", "title"] },
		);
		expect(result.map(column => column.key)).toEqual(["code", "title"]);
	});

	it("returns nothing when no column is mapped", () => {
		expect(visibleExportColumns([{ key: "option" }], {}, mapping)).toEqual([]);
	});
});

describe("toExportLanguage", () => {
	it("keeps supported UI languages and falls back to Vietnamese", () => {
		expect(toExportLanguage("en-US")).toBe("en-US");
		expect(toExportLanguage("zh-CN")).toBe("zh-CN");
		expect(toExportLanguage("vi-VN")).toBe("vi-VN");
		expect(toExportLanguage("fr")).toBe("vi-VN");
	});
});
