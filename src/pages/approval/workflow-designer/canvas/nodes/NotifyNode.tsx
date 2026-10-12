import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { BellOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function NotifyNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<BellOutlined />} color={token.cyan} />;
}

export const NotifyNode = memo(NotifyNodeImpl);
