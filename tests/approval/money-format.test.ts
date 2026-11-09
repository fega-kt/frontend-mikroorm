import { formatDecimal, formatMoneyInput, parseMoney } from "#src/pages/approval/lib/payload";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";

function setLanguage(language: string) {
	i18next.language = language;
}

afterEach(() => setLanguage("vi-VN"));

describe("định dạng số / tiền theo ngôn ngữ", () => {
	it("hiển thị: vi dùng '.' nhóm nghìn và ',' thập phân, en ngược lại", () => {
		setLanguage("vi-VN");
		expect(formatDecimal(2222222)).toBe("2.222.222");
		expect(formatDecimal(1234.5)).toBe("1.234,5");
		setLanguage("en-US");
		expect(formatDecimal(2222222)).toBe("2,222,222");
		expect(formatDecimal(1234.5)).toBe("1,234.5");
	});

	it("hiển thị: rỗng → chuỗi rỗng, gọn sai số số thực", () => {
		expect(formatDecimal(undefined)).toBe("");
		expect(formatDecimal("")).toBe("");
		expect(formatDecimal(0.1 + 0.2)).toBe("0,3");
	});

	it("ô nhập: giữ phần lẻ đang gõ dở, đổi dấu theo ngôn ngữ", () => {
		setLanguage("vi-VN");
		expect(formatMoneyInput("1234567")).toBe("1.234.567");
		expect(formatMoneyInput("12.")).toBe("12,");
		expect(formatMoneyInput("1234.50")).toBe("1.234,50");
		expect(formatMoneyInput("-1234.5")).toBe("-1.234,5");
		setLanguage("en-US");
		expect(formatMoneyInput("1234.50")).toBe("1,234.50");
	});

	it("ô nhập: parse ngược lại ra số với '.' thập phân", () => {
		setLanguage("vi-VN");
		expect(parseMoney("1.234,5")).toBe("1234.5");
		expect(parseMoney("12,")).toBe("12.");
		expect(parseMoney("")).toBeUndefined();
		setLanguage("en-US");
		expect(parseMoney("1,234.5")).toBe("1234.5");
	});

	it("format rồi parse lại ra đúng giá trị ở cả hai ngôn ngữ", () => {
		for (const language of ["vi-VN", "en-US"]) {
			setLanguage(language);
			expect(Number(parseMoney(formatMoneyInput("9876543.21")))).toBe(9876543.21);
		}
	});
});
