import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { TeamOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function ParallelNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<TeamOutlined />} color={token.purple} />;
}

export const ParallelNode = memo(ParallelNodeImpl);
