import type { ConditionRule, WfEdgeCondition } from "#src/api/setting/workflow-setting";
import { ConditionOperator } from "#src/api/setting/workflow-setting";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, theme, Typography } from "antd";

const OPERATOR_OPTIONS = [
	{ label: "=", value: "eq" },
	{ label: "≠", value: "ne" },
	{ label: ">", value: "gt" },
	{ label: "<", value: "lt" },
	{ label: "≥", value: "gte" },
	{ label: "≤", value: "lte" },
	{ label: "Chứa", value: "contains" },
	{ label: "K chứa", value: "notContains" },
];

interface EdgeConditionPanelProps {
	condition: WfEdgeCondition | undefined
	onChange: (condition: WfEdgeCondition) => void
}

function emptyCondition(): WfEdgeCondition {
	return { label: "", rules: [], logic: "and" };
}

function emptyRule(): ConditionRule {
	return { field: "", operator: ConditionOperator.Eq, value: "" };
}

export function EdgeConditionPanel({ condition, onChange }: EdgeConditionPanelProps) {
	const { token } = theme.useToken();
	const c = condition ?? emptyCondition();

	const update = (patch: Partial<WfEdgeCondition>) => onChange({ ...c, ...patch });

	const updateRule = (i: number, patch: Partial<ConditionRule>) => {
		const rules = c.rules.map((r, idx) => idx === i ? { ...r, ...patch } : r);
		onChange({ ...c, rules });
	};

	const addRule = () => update({ rules: [...c.rules, emptyRule()] });

	const removeRule = (i: number) => update({ rules: c.rules.filter((_, idx) => idx !== i) });

	return (
		<div className="p-3 flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<Typography.Text className="text-xs" style={{ color: token.colorTextSecondary }}>
					Nhãn điều kiện
				</Typography.Text>
				<Input
					size="small"
					placeholder="VD: Số tiền > 10tr"
					value={c.label}
					onChange={e => update({ label: e.target.value })}
				/>
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between">
					<Typography.Text className="text-xs" style={{ color: token.colorTextSecondary }}>
						Quy tắc
					</Typography.Text>
					<Select
						size="small"
						value={c.logic}
						onChange={v => update({ logic: v })}
						options={[{ label: "Tất cả (AND)", value: "and" }, { label: "Bất kỳ (OR)", value: "or" }]}
						style={{ width: 110 }}
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					{c.rules.map((rule, i) => (
						<div key={i} className="flex items-center gap-1">
							<Input
								size="small"
								placeholder="field"
								value={rule.field}
								onChange={e => updateRule(i, { field: e.target.value })}
								style={{ width: 80 }}
							/>
							<Select
								size="small"
								value={rule.operator}
								onChange={v => updateRule(i, { operator: v })}
								options={OPERATOR_OPTIONS}
								style={{ width: 72 }}
							/>
							<Input
								size="small"
								placeholder="giá trị"
								value={rule.value}
								onChange={e => updateRule(i, { value: e.target.value })}
								className="flex-1"
							/>
							<Button
								size="small"
								type="text"
								danger
								icon={<DeleteOutlined />}
								onClick={() => removeRule(i)}
							/>
						</div>
					))}
				</div>

				<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addRule} block>
					Thêm quy tắc
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					id="isDefault"
					checked={c.isDefault ?? false}
					onChange={e => update({ isDefault: e.target.checked })}
				/>
				<label htmlFor="isDefault" className="text-xs cursor-pointer" style={{ color: token.colorTextSecondary }}>
					Nhánh mặc định (fallback)
				</label>
			</div>
		</div>
	);
}
