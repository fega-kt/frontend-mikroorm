import { formatNumber } from "#src/utils/format-number";
import { describe, expect, it } from "vitest";

describe("formatNumber", () => {
	it("groups thousands by language", () => {
		expect(formatNumber(78005, "vi-VN")).toBe("78.005");
		expect(formatNumber(78005, "en-US")).toBe("78,005");
		expect(formatNumber(1234567, "vi-VN")).toBe("1.234.567");
	});

	it("defaults to Vietnamese like the rest of the app", () => {
		expect(formatNumber(78005)).toBe("78.005");
	});

	it("leaves small numbers and zero alone", () => {
		expect(formatNumber(0, "vi-VN")).toBe("0");
		expect(formatNumber(999, "vi-VN")).toBe("999");
	});

	it("passes Intl options through", () => {
		expect(formatNumber(1234.56, "vi-VN", { maximumFractionDigits: 1 })).toBe("1.234,6");
	});

	it("returns an empty string for anything that is not a finite number", () => {
		expect(formatNumber(undefined)).toBe("");
		expect(formatNumber(null)).toBe("");
		expect(formatNumber(Number.NaN)).toBe("");
		expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("");
	});
});
