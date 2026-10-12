import type { FormField } from "#src/api/setting/request-type/types";
import type { ConditionGroup } from "#src/pages/approval/workflow-designer/lib/condition";
import { FormFieldType } from "#src/api/setting/request-type/types";
import {
	defaultValueFor,
	initialRowFor,
	logicToRows,
	operatorsFor,
	rowsToLogic,
	summarizeCondition,
} from "#src/pages/approval/workflow-designer/lib/condition";
import { describe, expect, it } from "vitest";

const fields: FormField[] = [
	{ key: "days", label: "Số ngày", type: FormFieldType.Number },
	{
		key: "kind",
		label: "Loại nghỉ",
		type: FormFieldType.Select,
		options: [{ label: "Phép năm", value: "annual" }, { label: "Ốm", value: "sick" }],
	},
	{ key: "urgent", label: "Khẩn", type: FormFieldType.Switch },
	{ key: "amount", label: "Số tiền", type: FormFieldType.Money },
];

describe("condition builder ⇄ json-logic", () => {
	it("single row ⇄ plain comparison", () => {
		const group: ConditionGroup = { combinator: "and", rows: [{ field: "days", operator: ">", value: 3 }] };
		const logic = rowsToLogic(group);
		expect(logic).toEqual({ ">": [{ var: "payload.days" }, 3] });
		expect(logicToRows(logic)).toEqual(group);
	});

	it("multiple rows ⇄ and/or", () => {
		for (const combinator of ["and", "or"] as const) {
			const group: ConditionGroup = {
				combinator,
				rows: [
					{ field: "days", operator: ">=", value: 5 },
					{ field: "kind", operator: "in", value: ["annual", "sick"] },
					{ field: "urgent", operator: "==", value: true },
					{ field: "amount", operator: "!=", value: 0 },
				],
			};
			const logic = rowsToLogic(group);
			expect(logic).toEqual({
				[combinator]: [
					{ ">=": [{ var: "payload.days" }, 5] },
					{ in: [{ var: "payload.kind" }, ["annual", "sick"]] },
					{ "==": [{ var: "payload.urgent" }, true] },
					{ "!=": [{ var: "payload.amount" }, 0] },
				],
			});
			expect(logicToRows(logic)).toEqual(group);
		}
	});

	it("ignores rows without a field; empty → undefined", () => {
		expect(rowsToLogic({ combinator: "and", rows: [] })).toBeUndefined();
		expect(rowsToLogic({ combinator: "or", rows: [{ field: "", operator: ">", value: 1 }, { field: "days", operator: "<", value: 2 }] }))
			.toEqual({ "<": [{ var: "payload.days" }, 2] });
		expect(logicToRows(undefined)).toEqual({ combinator: "and", rows: [] });
	});

	it("normalizes strict equality and accepts var arrays", () => {
		expect(logicToRows({ "===": [{ var: ["payload.kind"] }, "sick"] })).toEqual({
			combinator: "and",
			rows: [{ field: "kind", operator: "==", value: "sick" }],
		});
	});

	it("returns null for expressions the builder cannot show", () => {
		expect(logicToRows({ and: [{ or: [{ ">": [{ var: "payload.days" }, 1] }] }] })).toBeNull();
		expect(logicToRows({ ">": [{ var: "days" }, 1] })).toBeNull();
		expect(logicToRows({ ">": [{ var: "payload.a" }, { var: "payload.b" }] })).toBeNull();
		expect(logicToRows({ in: [{ var: "payload.kind" }, "annual"] })).toBeNull();
		expect(logicToRows({ "!": [{ var: "payload.urgent" }] })).toBeNull();
	});
});

describe("summarizeCondition", () => {
	it("uses field and option labels", () => {
		expect(summarizeCondition({ ">": [{ var: "payload.days" }, 3] }, { fields })).toBe("Số ngày > 3");
		expect(summarizeCondition({
			and: [
				{ ">=": [{ var: "payload.days" }, 3] },
				{ "==": [{ var: "payload.kind" }, "annual"] },
			],
		}, { fields, and: "và" })).toBe("Số ngày ≥ 3 và Loại nghỉ = Phép năm");
	});

	it("formats or / in / booleans and falls back to keys", () => {
		expect(summarizeCondition({
			or: [
				{ in: [{ var: "payload.kind" }, ["annual", "sick"]] },
				{ "==": [{ var: "payload.urgent" }, true] },
			],
		}, { fields, or: "hoặc", yes: "Có" })).toBe("Loại nghỉ ∈ {Phép năm, Ốm} hoặc Khẩn = Có");
		expect(summarizeCondition({ "<": [{ var: "payload.other" }, 1] })).toBe("other < 1");
	});

	it("empty and raw fallbacks", () => {
		expect(summarizeCondition(undefined)).toBe("");
		expect(summarizeCondition({ "!": [{ var: "payload.urgent" }] })).toBe("{\"!\":[{\"var\":\"payload.urgent\"}]}");
	});
});

describe("helpers", () => {
	it("operators and default values by field type", () => {
		expect(operatorsFor(FormFieldType.Switch)).toEqual(["==", "!="]);
		expect(operatorsFor(FormFieldType.Number)).not.toContain("in");
		expect(defaultValueFor(fields[1], "in")).toEqual(["annual"]);
		expect(initialRowFor(fields[0])).toEqual({ field: "days", operator: ">", value: 0 });
	});
});
