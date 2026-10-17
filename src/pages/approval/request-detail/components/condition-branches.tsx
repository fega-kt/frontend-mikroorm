import type { WorkflowDefinition, WorkflowNode } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import { CheckCircleFilled } from "@ant-design/icons";
import { Tag, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { edgeLabelText, nodeTitle } from "../../workflow-designer/canvas/labels";

const { Text } = Typography;

interface ConditionBranchesProps {
	node: WorkflowNode
	definition: WorkflowDefinition
	fields: FormField[]
	/** Các node đơn đã đi qua trong vòng đang xem — để đánh dấu nhánh đã rẽ */
	visitedNodeIds: string[]
}

/** Các nhánh của node điều kiện: nhãn, điều kiện chạy, bước đi tới; nhánh đơn đã rẽ được đánh dấu */
export function ConditionBranches({ node, definition, fields, visitedNodeIds }: ConditionBranchesProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const visited = new Set(visitedNodeIds);
	// Nhánh mặc định luôn để cuối, đúng thứ tự xét của engine
	const branches = definition.edges
		.filter(edge => edge.from === node.id)
		.sort((a, b) => Number(!!a.default) - Number(!!b.default));

	return (
		<ul className="m-0 flex list-none flex-col gap-2 p-0">
			{branches.map((edge) => {
				const taken = visited.has(node.id) && visited.has(edge.to);
				const target = definition.nodes.find(item => item.id === edge.to);
				const condition = edge.default
					? t("approval.detail.branchElse")
					: edgeLabelText({ condition: edge.condition }, t, fields) || "—";
				return (
					<li
						key={edge.id ?? `${edge.from}-${edge.to}`}
						className="flex flex-col gap-1 rounded-md px-3 py-2"
						style={{
							border: `1px solid ${taken ? token.colorSuccessBorder : token.colorBorderSecondary}`,
							background: taken ? token.colorSuccessBg : undefined,
						}}
					>
						<div className="flex items-center justify-between gap-2">
							<Text strong className="truncate">{edge.label || (edge.default ? t("workflowDesigner.edge.default") : condition)}</Text>
							{taken && (
								<Tag color="success" bordered={false} icon={<CheckCircleFilled />} className="m-0 shrink-0">
									{t("approval.detail.branchTaken")}
								</Tag>
							)}
						</div>
						<Text className="text-[13px]">
							<Text type="secondary">{`${t("approval.detail.branchCondition")}: `}</Text>
							{condition}
						</Text>
						{target && (
							<Text type="secondary" className="text-xs">{`→ ${nodeTitle(target, t)}`}</Text>
						)}
					</li>
				);
			})}
		</ul>
	);
}
