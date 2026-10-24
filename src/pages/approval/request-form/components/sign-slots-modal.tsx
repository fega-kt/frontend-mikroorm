import type { PreviewFlowResult, SignSlot } from "#src/api/approval-request";
import type { PdfPageOverlayInfo } from "#src/components/file-viewer/pdf/pdf-view";
import { FileContextType } from "#src/api/file-view";
import { PdfFileView } from "#src/components/file-viewer";
import { SignatureBox } from "#src/pages/approval/request-detail/components/sign-approve-modal";
import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH } from "#src/pages/approval/request-detail/components/signature-size";
import { DeleteOutlined, FilePdfOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Modal, Tag, theme, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface SignSlotStep {
	nodeId: string
	/** Tên bước trong quy trình */
	name: string
	/** Người / nhóm duyệt của bước (từ luồng dự kiến) */
	approvers: PreviewFlowResult["steps"][number]["approvers"]
}

export interface SignSlotDocument {
	/** Id tệp gốc (khóa của ô ký) */
	id: string
	filename: string
}

interface SignSlotsModalProps {
	open: boolean
	documents: SignSlotDocument[]
	/** Các bước bắt buộc ký của quy trình dự kiến */
	steps: SignSlotStep[]
	value: SignSlot[]
	saving?: boolean
	onCancel: () => void
	onSave: (slots: SignSlot[]) => void
}

const keyOf = (file: string, nodeId: string) => `${file}|${nodeId}`;

/** Nhãn chính của bước: tên người / nhóm duyệt; không có ai thì dùng tên bước */
const approversLabel = (step: SignSlotStep) => step.approvers.map(a => a.name).join(", ") || step.name;

/** Một văn bản chỉ có một ô cho mỗi bước (suất 0); bước nhiều người / nhóm dùng chung ô đó */
function SignSlotsBody({ documents, steps, value, saving, onCancel, onSave }: Omit<SignSlotsModalProps, "open">) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [slots, setSlots] = useState<Record<string, SignSlot>>(() =>
		Object.fromEntries(value.filter(slot => slot.slot === 0).map(slot => [keyOf(slot.file, slot.nodeId), slot])),
	);
	const [fileId, setFileId] = useState(documents[0]?.id);
	const [nodeId, setNodeId] = useState(steps[0]?.nodeId);
	const [focus, setFocus] = useState<{ page: number }>();

	const doc = documents.find(item => item.id === fileId);
	const stepLabel = useMemo(() => new Map(steps.map(step => [step.nodeId, approversLabel(step)])), [steps]);
	// Mỗi bước một màu để phân biệt các khung trên trang
	const palette = [token.colorPrimary, token.colorSuccess, token.colorWarning, token.colorError, token.purple, token.cyan];
	const colorOf = (node: string) => palette[Math.max(0, steps.findIndex(step => step.nodeId === node)) % palette.length];
	const active = fileId && nodeId ? slots[keyOf(fileId, nodeId)] : undefined;

	const update = (file: string, node: string, patch: Partial<SignSlot>) =>
		setSlots(prev => ({ ...prev, [keyOf(file, node)]: { ...prev[keyOf(file, node)], ...patch } }));
	const remove = (file: string, node: string) =>
		setSlots((prev) => {
			const next = { ...prev };
			delete next[keyOf(file, node)];
			return next;
		});

	const save = () => {
		const files = new Set(documents.map(item => item.id));
		const nodes = new Set(steps.map(step => step.nodeId));
		// Ô của tệp đã gỡ / bước không còn trong quy trình dự kiến thì bỏ
		onSave(Object.values(slots).filter(slot => files.has(slot.file) && nodes.has(slot.nodeId)));
	};

	const renderOverlay = (info: PdfPageOverlayInfo) => {
		if (!fileId)
			return null;
		const onThisPage = Object.values(slots).filter(slot => slot.file === fileId && slot.placement.page === info.pageNumber);
		// Nhấp chỗ trống: đặt (hoặc chuyển) khung của bước đang chọn tới đó, căn giữa theo điểm nhấp
		const placeAt = (event: React.MouseEvent<HTMLDivElement>) => {
			if (!nodeId)
				return;
			const current = slots[keyOf(fileId, nodeId)];
			const width = current?.placement.width ?? SIGNATURE_WIDTH;
			const height = current?.placement.height ?? SIGNATURE_HEIGHT;
			const rect = event.currentTarget.getBoundingClientRect();
			const x = (event.clientX - rect.left) / info.scale - width / 2;
			const y = info.size.height - (event.clientY - rect.top) / info.scale - height / 2;
			const placement = {
				page: info.pageNumber,
				width,
				height,
				x: Math.min(Math.max(0, x), info.size.width - width),
				y: Math.min(Math.max(0, y), info.size.height - height),
			};
			setSlots(prev => ({
				...prev,
				[keyOf(fileId, nodeId)]: { file: fileId, nodeId, slot: 0, locked: current?.locked ?? false, placement },
			}));
		};
		const label = (node: string, activeBox: boolean) => {
			const color = colorOf(node);
			return (
				<div
					className="relative flex size-full items-center justify-center overflow-hidden px-1.5 text-center font-semibold leading-tight"
					style={{
						fontSize: 12 * info.scale,
						color,
						background: `color-mix(in srgb, ${color} ${activeBox ? 20 : 8}%, transparent)`,
						borderLeft: `${3 * info.scale}px solid ${color}`,
					}}
				>
					<span className="line-clamp-2 break-words">{stepLabel.get(node)}</span>
				</div>
			);
		};
		return (
			<div className="absolute inset-0 cursor-copy" onClick={placeAt}>
				{onThisPage.map(slot => slot.nodeId === nodeId
					? (
						<SignatureBox
							key={slot.nodeId}
							placement={slot.placement}
							info={info}
							content={label(slot.nodeId, true)}
							onMove={placement => update(slot.file, slot.nodeId, { placement })}
						/>
					)
					: (
						<div
							key={slot.nodeId}
							role="button"
							className="absolute cursor-pointer"
							style={{
								left: slot.placement.x * info.scale,
								top: (info.size.height - slot.placement.y - slot.placement.height) * info.scale,
								width: slot.placement.width * info.scale,
								height: slot.placement.height * info.scale,
								outline: `1.5px dashed ${token.colorTextQuaternary}`,
								outlineOffset: 3,
							}}
							onClick={(event) => {
								event.stopPropagation();
								setNodeId(slot.nodeId);
							}}
						>
							{label(slot.nodeId, false)}
						</div>
					))}
			</div>
		);
	};

	return (
		<div className="flex h-full flex-col md:flex-row">
			<div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:w-[340px] md:shrink-0" style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}>
				<Alert type="info" showIcon message={t("approval.signSlots.hint")} />

				<div className="flex flex-col gap-1.5">
					<Text strong>{t("approval.sign.documents")}</Text>
					{documents.map((item) => {
						const selected = item.id === fileId;
						const placed = steps.filter(step => slots[keyOf(item.id, step.nodeId)]).length;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => setFileId(item.id)}
								className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left"
								style={{
									border: `1px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
									background: selected ? token.colorPrimaryBg : token.colorBgContainer,
									color: token.colorText,
								}}
							>
								<FilePdfOutlined style={{ color: token.colorError }} />
								<span className="min-w-0 flex-1 truncate text-[13px]">{item.filename}</span>
								<Tag className="m-0" bordered={false}>{`${placed}/${steps.length}`}</Tag>
							</button>
						);
					})}
				</div>

				<div className="flex flex-col gap-1.5">
					<Text strong>{t("approval.signSlots.steps")}</Text>
					{steps.map((step, index) => {
						const slot = fileId ? slots[keyOf(fileId, step.nodeId)] : undefined;
						const selected = step.nodeId === nodeId;
						const color = colorOf(step.nodeId);
						return (
							<div
								key={step.nodeId}
								className="flex flex-col gap-1.5 rounded-md px-2.5 py-2"
								style={{
									border: `1px solid ${selected ? color : token.colorBorderSecondary}`,
									borderLeft: `4px solid ${color}`,
									background: selected ? `color-mix(in srgb, ${color} 8%, ${token.colorBgContainer})` : token.colorBgContainer,
								}}
							>
								<button
									type="button"
									className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left"
									style={{ color: token.colorText }}
									onClick={() => {
										setNodeId(step.nodeId);
										if (slot)
											setFocus({ page: slot.placement.page });
									}}
								>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className="truncate text-[13px] font-semibold">{approversLabel(step)}</span>
										<span className="truncate text-xs" style={{ color: token.colorTextSecondary }}>
											{`${index + 1}. ${step.name}`}
										</span>
									</span>
									{slot
										? <Tag className="m-0" color="blue" bordered={false}>{t("approval.sign.page", { page: slot.placement.page })}</Tag>
										: <Tag className="m-0" bordered={false}>{t("approval.signSlots.notPlaced")}</Tag>}
								</button>
								{slot && fileId && (
									<div className="flex items-center justify-between">
										<Checkbox checked={slot.locked} onChange={event => update(fileId, step.nodeId, { locked: event.target.checked })}>
											<span className="text-xs">
												<LockOutlined />
												{" "}
												{t("approval.signSlots.lock")}
											</span>
										</Checkbox>
										<Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(fileId, step.nodeId)}>
											{t("approval.signSlots.remove")}
										</Button>
									</div>
								)}
							</div>
						);
					})}
					{active?.locked && <Text type="secondary" className="text-xs">{t("approval.signSlots.lockHint")}</Text>}
				</div>

				<div className="flex-1" />
				<div className="flex gap-2">
					<Button block disabled={saving} onClick={onCancel}>{t("common.cancel")}</Button>
					<Button block type="primary" loading={saving} onClick={save}>{t("approval.signSlots.save")}</Button>
				</div>
			</div>

			<div className="min-h-0 min-w-0 flex-1 max-md:hidden">
				{doc
					? (
						<PdfFileView
							key={doc.id}
							target={{ contextType: FileContextType.ApprovalRequest, fileId: doc.id, filename: doc.filename }}
							renderPageOverlay={renderOverlay}
							focusPage={focus}
							// Word / Excel / PowerPoint được chuyển tạm sang PDF để xem và đặt khung (không lưu vào tờ trình)
							asPdf
						/>
					)
					: <div className="flex h-full items-center justify-center" style={{ color: token.colorTextTertiary }}>{t("approval.sign.noDocument")}</div>}
			</div>
		</div>
	);
}

/** Người trình đặt sẵn vị trí ký của từng bước trên các văn bản PDF đã lưu của tờ trình */
export function SignSlotsModal({ open, ...props }: SignSlotsModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Modal
			open={open}
			title={t("approval.signSlots.title")}
			footer={null}
			onCancel={props.saving ? undefined : props.onCancel}
			closable={!props.saving}
			maskClosable={false}
			destroyOnHidden
			width="100vw"
			style={{ top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
			styles={{
				wrapper: { padding: 0 },
				container: { height: "100vh", padding: 0, borderRadius: 0, display: "flex", flexDirection: "column" },
				header: { padding: "14px 20px", margin: 0, borderBottom: `1px solid ${token.colorBorderSecondary}` },
				body: { padding: 0, flex: 1, minHeight: 0, overflow: "hidden" },
			}}
		>
			<SignSlotsBody {...props} />
		</Modal>
	);
}
