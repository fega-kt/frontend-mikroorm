import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { CheckCircleOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function EndNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<CheckCircleOutlined />} color={token.colorTextSecondary} compact hasSource={false} />;
}

export const EndNode = memo(EndNodeImpl);
