import type { ApprovalNode, GraphError, NotifyNode, ParallelNode } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { ReactNode } from "react";
import type { FlowEdge, FlowNode } from "../lib/to-definition";
import { NodeType } from "#src/api/approval-workflow/types";
import { ArrowRightOutlined, CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Tag, theme, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { edgeLabelText, nodeTitle } from "../canvas/labels";
import { groupErrors } from "../lib/errors";
import { useDesigner } from "../store/designer.store";
import { BranchEditor } from "./BranchEditor";
import { ApprovalPanel, NamePanel, NotifyPanel, ParallelPanel } from "./panels";

interface NodeInspectorProps {
	fields: FormField[]
	disabled: boolean
}

const TYPE_COLOR: Record<string, string> = {
	[NodeType.Start]: "green",
	[NodeType.Approval]: "blue",
	[NodeType.Condition]: "orange",
	[NodeType.Parallel]: "purple",
	[NodeType.Notify]: "cyan",
	[NodeType.End]: "default",
};

/** Cột phải: thuộc tính của bước / nhánh đang chọn */
export function NodeInspector({ fields, disabled }: NodeInspectorProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const selectedId = useDesigner(s => s.selectedId);
	const nodes = useDesigner(s => s.nodes);
	const edges = useDesigner(s => s.edges);
	const errors = useDesigner(s => s.errors);

	const translate = (err: GraphError) => t(`workflowDesigner.errors.${err.code}`, { defaultValue: err.message });
	const { nodeErrors, edgeErrors } = useMemo(
		() => groupErrors(errors, edges, err => t(`workflowDesigner.errors.${err.code}`, { defaultValue: err.message })),
		[errors, edges, t],
	);

	const node = nodes.find(n => n.id === selectedId);
	const edge = node ? undefined : edges.find(e => e.id === selectedId);

	if (!node && !edge) {
		const globalErrors = errors.filter(e => !e.nodeId && !e.edgeId);
		return (
			<div className="flex h-full flex-col gap-3 p-4">
				{globalErrors.length > 0 && <Alert type="error" showIcon message={globalErrors.map(translate).join(" · ")} />}
				<Empty className="mt-16" image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("workflowDesigner.inspector.empty")} />
			</div>
		);
	}

	if (edge)
		return <EdgeInspector edge={edge} nodes={nodes} fields={fields} disabled={disabled} errors={edgeErrors[edge.id] ?? []} />;

	return <StepInspector node={node!} nodes={nodes} edges={edges} fields={fields} disabled={disabled} errors={nodeErrors[node!.id] ?? []} token={token} />;
}

function Header({ tag, tagColor, title, subtitle }: { tag: ReactNode, tagColor?: string, title: ReactNode, subtitle?: ReactNode }) {
	const { token } = theme.useToken();
	return (
		<div className="px-4 pb-3 pt-4" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
			<Tag color={tagColor} bordered={false} className="mb-1.5">{tag}</Tag>
			<Typography.Title level={5} className="m-0" ellipsis>{title}</Typography.Title>
			{subtitle && <Typography.Text type="secondary" className="text-xs">{subtitle}</Typography.Text>}
		</div>
	);
}

function ErrorAlert({ errors }: { errors: string[] }) {
	if (!errors.length)
		return null;
	return (
		<Alert
			type="error"
			showIcon
			className="mb-4"
			message={errors.length === 1
				? errors[0]
				: (
					<ul className="m-0 pl-4">
						{errors.map(e => <li key={e}>{e}</li>)}
					</ul>
				)}
		/>
	);
}

interface StepInspectorProps {
	node: FlowNode
	nodes: FlowNode[]
	edges: FlowEdge[]
	fields: FormField[]
	disabled: boolean
	errors: string[]
	token: ReturnType<typeof theme.useToken>["token"]
}

function StepInspector({ node, nodes, edges, fields, disabled, errors, token }: StepInspectorProps) {
	const { t } = useTranslation();
	const removeNode = useDesigner(s => s.removeNode);
	const duplicateNode = useDesigner(s => s.duplicateNode);
	const addBranch = useDesigner(s => s.addBranch);
	const select = useDesigner(s => s.select);
	const wf = node.data.node;

	// Bước nằm trong một nhánh điều kiện → hiện nhánh và điều kiện chạy
	const branchIn = edges.filter(e => e.target === node.id && nodes.find(n => n.id === e.source)?.type === NodeType.Condition);
	let tag = t(`workflowDesigner.nodeTypes.${wf.type}`);
	let subtitle: string | undefined;
	if (branchIn.length === 1) {
		const data = branchIn[0].data;
		if (data?.label)
			tag = `${tag} · ${t("workflowDesigner.inspector.branchOf", { label: data.label })}`;
		subtitle = data?.default
			? t("workflowDesigner.inspector.runsByDefault")
			: data?.condition
				? t("workflowDesigner.inspector.onlyWhen", { cond: edgeLabelText({ condition: data.condition }, t, fields) })
				: undefined;
	}

	let panel: ReactNode;
	switch (wf.type) {
		case NodeType.Approval:
			panel = <ApprovalPanel node={wf as ApprovalNode} disabled={disabled} />;
			break;
		case NodeType.Parallel:
			panel = <ParallelPanel node={wf as ParallelNode} disabled={disabled} />;
			break;
		case NodeType.Notify:
			panel = <NotifyPanel node={wf as NotifyNode} disabled={disabled} />;
			break;
		case NodeType.Condition: {
			const outs = edges
				.filter(e => e.source === node.id)
				.sort((a, b) => Number(!!a.data?.default) - Number(!!b.data?.default));
			panel = (
				<>
					<NamePanel node={wf} disabled={disabled} />
					<Typography.Text strong className="mb-2 block text-[13px]">{t("workflowDesigner.inspector.branches")}</Typography.Text>
					<div className="flex flex-col gap-3">
						{outs.map((e) => {
							const target = nodes.find(n => n.id === e.target);
							return (
								<Card
									key={e.id}
									size="small"
									styles={{ body: { padding: 12 } }}
									title={(
										<span className="flex items-center gap-1.5 text-xs font-normal">
											<ArrowRightOutlined style={{ color: token.colorTextTertiary }} />
											<Typography.Link className="text-xs" onClick={() => select(e.target)} ellipsis>
												{target ? nodeTitle(target.data.node, t) : e.target}
											</Typography.Link>
										</span>
									)}
								>
									<BranchEditor edge={e} fields={fields} disabled={disabled} />
								</Card>
							);
						})}
						<Button type="dashed" icon={<PlusOutlined />} disabled={disabled} onClick={() => addBranch(node.id)}>
							{t("workflowDesigner.actions.addBranch")}
						</Button>
					</div>
				</>
			);
			break;
		}
		default:
			panel = (
				<NamePanel
					node={wf}
					disabled={disabled}
					hint={wf.type === NodeType.Start ? t("workflowDesigner.inspector.startHint") : t("workflowDesigner.inspector.endHint")}
				/>
			);
	}

	return (
		<div className="flex h-full flex-col">
			<Header tag={tag} tagColor={TYPE_COLOR[wf.type]} title={nodeTitle(wf, t)} subtitle={subtitle} />
			<div className="min-h-0 flex-1 overflow-auto p-4">
				<ErrorAlert errors={errors} />
				{/* key theo id để form khởi tạo lại khi đổi bước */}
				<div key={node.id}>{panel}</div>
			</div>
			{wf.type !== NodeType.Start && (
				<div className="flex gap-2 px-4 py-3" style={{ borderTop: `1px solid ${token.colorSplit}` }}>
					<Button danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => removeNode(node.id)} className="flex-1">
						{t("workflowDesigner.actions.deleteStep")}
					</Button>
					<Button icon={<CopyOutlined />} disabled={disabled} onClick={() => duplicateNode(node.id)} className="flex-1">
						{t("workflowDesigner.actions.duplicate")}
					</Button>
				</div>
			)}
		</div>
	);
}

function EdgeInspector({ edge, nodes, fields, disabled, errors }: { edge: FlowEdge, nodes: FlowNode[], fields: FormField[], disabled: boolean, errors: string[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const removeEdge = useDesigner(s => s.removeEdge);
	const select = useDesigner(s => s.select);
	const source = nodes.find(n => n.id === edge.source);
	const target = nodes.find(n => n.id === edge.target);
	const isBranch = source?.type === NodeType.Condition;

	return (
		<div className="flex h-full flex-col">
			<Header
				tag={isBranch ? t("workflowDesigner.inspector.edgeTitle") : t("workflowDesigner.inspector.plainEdge")}
				tagColor={isBranch ? "orange" : "default"}
				title={(
					<span className="flex items-center gap-1.5 text-sm">
						<Typography.Link onClick={() => source && select(source.id)}>{source ? nodeTitle(source.data.node, t) : edge.source}</Typography.Link>
						<ArrowRightOutlined style={{ color: token.colorTextTertiary }} />
						<Typography.Link onClick={() => target && select(target.id)}>{target ? nodeTitle(target.data.node, t) : edge.target}</Typography.Link>
					</span>
				)}
			/>
			<div className="min-h-0 flex-1 overflow-auto p-4">
				<ErrorAlert errors={errors} />
				{isBranch
					? <BranchEditor key={edge.id} edge={edge} fields={fields} disabled={disabled} />
					: <Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.inspector.plainEdgeHint")}</Typography.Text>}
			</div>
			<div className="px-4 py-3" style={{ borderTop: `1px solid ${token.colorSplit}` }}>
				<Button danger block icon={<DeleteOutlined />} disabled={disabled} onClick={() => removeEdge(edge.id)}>
					{t("workflowDesigner.inspector.deleteEdge")}
				</Button>
			</div>
		</div>
	);
}
