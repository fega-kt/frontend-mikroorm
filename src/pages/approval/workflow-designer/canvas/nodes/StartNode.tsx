import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { PlayCircleFilled } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function StartNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<PlayCircleFilled />} color={token.colorSuccess} compact hasTarget={false} />;
}

export const StartNode = memo(StartNodeImpl);
