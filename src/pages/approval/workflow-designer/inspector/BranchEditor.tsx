import type { FormField } from "#src/api/setting/request-type/types";
import type { FlowEdge } from "../lib/to-definition";
import { Checkbox, Input, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useDesigner } from "../store/designer.store";
import { ConditionBuilder } from "./ConditionBuilder";

interface BranchEditorProps {
	edge: FlowEdge
	fields: FormField[]
	disabled: boolean
}

/** Sửa một nhánh rẽ của node điều kiện: nhãn, cờ mặc định, điều kiện */
export function BranchEditor({ edge, fields, disabled }: BranchEditorProps) {
	const { t } = useTranslation();
	const updateEdgeData = useDesigner(s => s.updateEdgeData);
	const setDefaultEdge = useDesigner(s => s.setDefaultEdge);
	const isDefault = !!edge.data?.default;

	return (
		<div className="flex flex-col gap-2.5">
			<div>
				<Typography.Text type="secondary" className="mb-1 block text-xs">{t("workflowDesigner.inspector.branchLabel")}</Typography.Text>
				<Input
					size="small"
					value={edge.data?.label ?? ""}
					maxLength={60}
					disabled={disabled}
					placeholder={t("workflowDesigner.edge.yes")}
					onChange={e => updateEdgeData(edge.id, { label: e.target.value || undefined })}
				/>
			</div>
			<Checkbox checked={isDefault} disabled={disabled} onChange={e => setDefaultEdge(edge.id, e.target.checked)}>
				{t("workflowDesigner.inspector.isDefault")}
			</Checkbox>
			{isDefault
				? <Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.inspector.runsByDefault")}</Typography.Text>
				: (
					<div>
						<Typography.Text type="secondary" className="mb-1 block text-xs">{t("workflowDesigner.inspector.condition")}</Typography.Text>
						<ConditionBuilder
							key={edge.id}
							value={edge.data?.condition}
							fields={fields}
							disabled={disabled}
							onChange={condition => updateEdgeData(edge.id, { condition })}
						/>
					</div>
				)}
		</div>
	);
}
