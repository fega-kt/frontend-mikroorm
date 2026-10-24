import type { PreviewFlowResult } from "#src/api/approval-request";
import { PrincipalPicker } from "#src/components/principal-picker";
import { CheckOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Skeleton, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface FlowPreviewProps {
	preview?: PreviewFlowResult | null
	loading?: boolean
	/** Chưa chọn loại tờ trình */
	empty?: boolean
}

/** Luồng phê duyệt dự kiến: các bước + người duyệt, bước bỏ qua hiện mờ */
export function FlowPreview({ preview, loading, empty }: FlowPreviewProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	if (empty)
		return <Text type="secondary">{t("approval.flow.chooseType")}</Text>;
	if (loading && !preview)
		return <Skeleton active paragraph={{ rows: 4 }} title={false} />;
	if (!preview?.workflow)
		return <Alert type="info" showIcon message={t("approval.messages.noWorkflow")} />;

	const dot = (content: React.ReactNode, style: React.CSSProperties) => (
		<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={style}>{content}</span>
	);
	const line = <span className="w-0.5 flex-1" style={{ minHeight: 16, background: token.colorBorderSecondary }} />;
	const steps = preview.steps.filter(step => step.type !== "notify");

	return (
		<div className="flex flex-col" style={{ opacity: loading ? 0.6 : 1 }}>
			<Text type="secondary" className="mb-3 text-xs">
				{t("approval.flow.workflow", { name: preview.workflow.name, version: preview.workflow.version })}
			</Text>
			<ol className="m-0 flex list-none flex-col p-0">
				<li className="flex gap-3">
					<div className="flex flex-col items-center">
						{dot(<SendOutlined />, { background: token.colorPrimaryBg, color: token.colorPrimary })}
						{line}
					</div>
					<div className="pb-4">
						<div className="font-semibold">{t("approval.flow.submit")}</div>
						<Text type="secondary" className="text-[13px]">{t("approval.flow.you")}</Text>
					</div>
				</li>
				{steps.map((step, index) => {
					const blocked = step.error && !step.skipped;
					return (
						<li key={step.nodeId} className="flex gap-3">
							<div className="flex flex-col items-center">
								{dot(index + 1, step.skipped
									? { border: `2px dashed ${token.colorTextQuaternary}`, color: token.colorTextTertiary }
									: { border: `2px solid ${blocked ? token.colorError : token.colorPrimary}`, color: blocked ? token.colorError : token.colorPrimary })}
								{line}
							</div>
							<div className="flex min-w-0 flex-col gap-0.5 pb-4">
								<span className="font-semibold" style={{ color: step.skipped ? token.colorTextTertiary : undefined }}>
									{step.name || t(`workflowDesigner.nodeTypes.${step.type}`)}
								</span>
								{step.skipped && (
									<span className="self-start rounded px-2 py-0.5 text-xs" style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }}>
										{t("approval.flow.skipped")}
									</span>
								)}
								{!step.skipped && step.approvers.length > 0 && (
									<div className="flex flex-wrap gap-x-3 gap-y-1">
										{step.approvers.map(approver => (
											<PrincipalPicker
												key={approver.id}
												readonly
												size="small"
												principal={approver}
												className="!min-h-0"
											/>
										))}
									</div>
								)}
								{blocked && <Text type="danger" className="text-xs">{t("approval.flow.noApprover")}</Text>}
							</div>
						</li>
					);
				})}
				<li className="flex gap-3">
					{dot(<CheckOutlined />, preview.outcome === "approved"
						? { background: token.colorSuccessBg, color: token.colorSuccess }
						: { background: token.colorErrorBg, color: token.colorError })}
					<div className="font-semibold">{t(preview.outcome === "approved" ? "approval.flow.done" : "approval.flow.blocked")}</div>
				</li>
			</ol>
		</div>
	);
}
