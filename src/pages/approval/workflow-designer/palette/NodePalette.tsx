import type { ApprovalWorkflowDetail, ApprovalWorkflowVersion } from "#src/api/approval-workflow/types";
import type { DragEvent, ReactNode } from "react";
import type { AddableNodeType } from "../lib/node-factory";
import { NodeType } from "#src/api/approval-workflow/types";
import { AuditOutlined, BellOutlined, BranchesOutlined, CheckCircleOutlined, HolderOutlined, TeamOutlined } from "@ant-design/icons";
import { theme, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { PALETTE_DND_MIME } from "../canvas/DesignerCanvas";
import { PALETTE_TYPES } from "../lib/node-factory";
import { useDesigner } from "../store/designer.store";
import { ApplyToCard } from "./ApplyToCard";
import { VersionList } from "./VersionList";

interface NodePaletteProps {
	detail: ApprovalWorkflowDetail
	readOnly: boolean
	canEdit: boolean
	onMetaSaved: () => void
	onPreviewVersion: (version: ApprovalWorkflowVersion) => void
}

/** Cột trái: thẻ thành phần kéo thả + Áp dụng cho + Phiên bản */
export function NodePalette({ detail, readOnly, canEdit, onMetaSaved, onPreviewVersion }: NodePaletteProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	const icons: Record<AddableNodeType, { icon: ReactNode, color: string }> = {
		[NodeType.Approval]: { icon: <AuditOutlined />, color: token.colorPrimary },
		[NodeType.Condition]: { icon: <BranchesOutlined />, color: token.colorWarning },
		[NodeType.Parallel]: { icon: <TeamOutlined />, color: token.purple },
		[NodeType.Notify]: { icon: <BellOutlined />, color: token.cyan },
		[NodeType.End]: { icon: <CheckCircleOutlined />, color: token.colorTextSecondary },
	};

	return (
		<div className="flex flex-col gap-5 p-4">
			<section>
				<Typography.Text strong className="block text-[13px]">{t("workflowDesigner.palette.title")}</Typography.Text>
				<Typography.Text type="secondary" className="mb-2.5 block text-xs">{t("workflowDesigner.palette.hint")}</Typography.Text>
				<div className="flex flex-col gap-2">
					{PALETTE_TYPES.map(type => (
						<PaletteCard key={type} type={type} icon={icons[type].icon} color={icons[type].color} disabled={readOnly} />
					))}
				</div>
			</section>
			<ApplyToCard detail={detail} disabled={!canEdit} onSaved={onMetaSaved} />
			<VersionList detail={detail} onPreview={onPreviewVersion} />
		</div>
	);
}

function PaletteCard({ type, icon, color, disabled }: { type: AddableNodeType, icon: ReactNode, color: string, disabled: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const addNode = useDesigner(s => s.addNode);

	const onDragStart = (e: DragEvent) => {
		e.dataTransfer.setData(PALETTE_DND_MIME, type);
		e.dataTransfer.effectAllowed = "move";
	};

	return (
		<Tooltip title={disabled ? undefined : t("workflowDesigner.palette.clickToAdd")} placement="right" mouseEnterDelay={0.6}>
			<div
				draggable={!disabled}
				onDragStart={onDragStart}
				onClick={() => !disabled && addNode(type)}
				className="group flex select-none items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
				style={{
					border: `1px solid ${token.colorBorderSecondary}`,
					background: token.colorBgContainer,
					cursor: disabled ? "not-allowed" : "grab",
					opacity: disabled ? 0.6 : 1,
				}}
				onMouseEnter={e => !disabled && (e.currentTarget.style.borderColor = token.colorPrimaryBorderHover)}
				onMouseLeave={e => (e.currentTarget.style.borderColor = token.colorBorderSecondary)}
			>
				<span
					className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base"
					style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
				>
					{icon}
				</span>
				<div className="min-w-0 flex-1 leading-tight">
					<div className="truncate text-[13px] font-medium" style={{ color: token.colorText }}>
						{t(`workflowDesigner.palette.items.${type}.title`)}
					</div>
					<div className="truncate text-xs" style={{ color: token.colorTextSecondary }}>
						{t(`workflowDesigner.palette.items.${type}.desc`)}
					</div>
				</div>
				{!disabled && <HolderOutlined style={{ color: token.colorTextQuaternary }} />}
			</div>
		</Tooltip>
	);
}
