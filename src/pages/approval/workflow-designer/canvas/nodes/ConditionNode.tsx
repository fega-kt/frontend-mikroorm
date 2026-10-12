import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { BranchesOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function ConditionNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<BranchesOutlined />} color={token.colorWarning} />;
}

export const ConditionNode = memo(ConditionNodeImpl);
