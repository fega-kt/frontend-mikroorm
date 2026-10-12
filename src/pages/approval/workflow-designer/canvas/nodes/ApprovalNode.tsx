import type { NodeProps } from "@xyflow/react";
import type { FlowNode } from "../../lib/to-definition";
import { AuditOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { memo } from "react";
import { NodeShell } from "./NodeShell";

function ApprovalNodeImpl({ id, data }: NodeProps<FlowNode>) {
	const { token } = theme.useToken();
	return <NodeShell id={id} node={data.node} icon={<AuditOutlined />} color={token.colorPrimary} />;
}

export const ApprovalNode = memo(ApprovalNodeImpl);
