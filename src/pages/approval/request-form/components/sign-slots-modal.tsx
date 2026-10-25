import type { PreviewFlowResult, SignSlot } from "#src/api/approval-request";
import type { SignaturePlacement } from "#src/api/signing-certificate";
import type { PdfPageOverlayInfo } from "#src/components/file-viewer/pdf/pdf-view";
import { FileContextType } from "#src/api/file-view";
import { PdfFileView } from "#src/components/file-viewer";
import { SignatureBox } from "#src/pages/approval/request-detail/components/sign-approve-modal";
import { SignatureAppearance } from "#src/pages/approval/request-detail/components/signature-appearance";
import { placeholderSignatureLines } from "#src/pages/approval/request-detail/components/signature-lines";
import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH } from "#src/pages/approval/request-detail/components/signature-size";
import { CheckOutlined, DeleteOutlined, FilePdfOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Button, Modal, theme, Tooltip } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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

/** Bước một người: tên + đơn vị; nhóm / nhiều người: tên chung */
function stepSignatureLines(step: SignSlotStep) {
	const user = step.approvers.length === 1 ? step.approvers[0].user : undefined;
	return placeholderSignatureLines(user?.fullName ?? approversLabel(step), user?.departmentName);
}

function StepBadge({ index, color, locked, title }: { index: number, color: string, locked?: boolean, title: string }) {
	return (
		<Tooltip title={title}>
			<span
				className="absolute flex h-[22px] min-w-[22px] items-center justify-center gap-[3px] rounded-full px-1.5 text-[11px] font-bold leading-none text-white"
				style={{ left: -15, top: -15, background: color, border: "2px solid white", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.25)" }}
			>
				{index + 1}
				{locked && <LockOutlined className="text-[9px]" />}
			</span>
		</Tooltip>
	);
}

interface PlacementLayerProps {
	info: PdfPageOverlayInfo
	/** Bước chưa đặt: khung mờ theo con trỏ */
	ghost?: { color: string, lines: string[] }
	size: { width: number, height: number }
	onPlace: (placement: SignaturePlacement) => void
	children: React.ReactNode
}

/** Lớp phủ một trang: nhấp để đặt khung của bước đang chọn */
function PlacementLayer({ info, ghost, size, onPlace, children }: PlacementLayerProps) {
	const [hover, setHover] = useState<SignaturePlacement>();
	const placementAt = (event: React.MouseEvent<HTMLDivElement>): SignaturePlacement => {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - rect.left) / info.scale - size.width / 2;
		const y = info.size.height - (event.clientY - rect.top) / info.scale - size.height / 2;
		return {
			page: info.pageNumber,
			...size,
			x: Math.min(Math.max(0, x), info.size.width - size.width),
			y: Math.min(Math.max(0, y), info.size.height - size.height),
		};
	};
	return (
		<div
			className="absolute inset-0 cursor-copy"
			onClick={event => onPlace(placementAt(event))}
			onMouseMove={ghost ? event => setHover(event.target === event.currentTarget ? placementAt(event) : undefined) : undefined}
			onMouseLeave={() => setHover(undefined)}
		>
			{children}
			{ghost && hover && (
				<div
					className="pointer-events-none absolute opacity-60"
					style={{ left: hover.x * info.scale, top: (info.size.height - hover.y - hover.height) * info.scale }}
				>
					<SignatureAppearance width={hover.width} height={hover.height} scale={info.scale} lines={ghost.lines} signatureImage={null} placeholderColor={ghost.color} />
				</div>
			)}
		</div>
	);
}

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
	const palette = [token.colorPrimary, token.orange7, token.purple6, token.cyan7, token.magenta6, token.green7];
	const stepInfo = useMemo(() => new Map(steps.map((step, index) => [step.nodeId, { step, index, lines: stepSignatureLines(step) }])), [steps]);
	const colorOf = (node: string) => palette[(stepInfo.get(node)?.index ?? 0) % palette.length];
	const titleOf = (node: string) => {
		const info = stepInfo.get(node);
		return info ? t("approval.signSlots.stepTooltip", { index: info.index + 1, name: info.step.name }) : "";
	};

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
		const current = nodeId ? slots[keyOf(fileId, nodeId)] : undefined;
		const size = { width: current?.placement.width ?? SIGNATURE_WIDTH, height: current?.placement.height ?? SIGNATURE_HEIGHT };
		return (
			<PlacementLayer
				info={info}
				size={size}
				ghost={nodeId && !current ? { color: colorOf(nodeId), lines: stepInfo.get(nodeId)?.lines ?? [] } : undefined}
				onPlace={(placement) => {
					if (nodeId)
						setSlots(prev => ({ ...prev, [keyOf(fileId, nodeId)]: { file: fileId, nodeId, slot: 0, locked: current?.locked ?? false, placement } }));
				}}
			>
				{onThisPage.map((slot) => {
					const color = colorOf(slot.nodeId);
					const lines = stepInfo.get(slot.nodeId)?.lines ?? [];
					const badge = <StepBadge index={stepInfo.get(slot.nodeId)?.index ?? 0} color={color} locked={slot.locked} title={titleOf(slot.nodeId)} />;
					if (slot.nodeId !== nodeId) {
						const { placement } = slot;
						return (
							<div
								key={slot.nodeId}
								role="button"
								className="absolute cursor-pointer"
								style={{
									left: placement.x * info.scale,
									top: (info.size.height - placement.y - placement.height) * info.scale,
								}}
								onClick={(event) => {
									event.stopPropagation();
									setNodeId(slot.nodeId);
								}}
							>
								<SignatureAppearance width={placement.width} height={placement.height} scale={info.scale} lines={lines} signatureImage={null} placeholderColor={color} />
								{badge}
							</div>
						);
					}
					return (
						<SignatureBox
							key={slot.nodeId}
							placement={slot.placement}
							info={info}
							lines={lines}
							accent={color}
							onMove={placement => update(slot.file, slot.nodeId, { placement })}
						>
							{badge}
							<div
								className="absolute flex items-center gap-0.5 rounded-md p-0.5"
								style={{ right: -5, top: -42, background: token.colorBgElevated, boxShadow: token.boxShadowSecondary }}
								onPointerDown={event => event.stopPropagation()}
							>
								<Tooltip title={t(slot.locked ? "approval.signSlots.unlock" : "approval.signSlots.lock")}>
									<Button
										size="small"
										type="text"
										aria-label={t(slot.locked ? "approval.signSlots.unlock" : "approval.signSlots.lock")}
										icon={slot.locked ? <LockOutlined /> : <UnlockOutlined />}
										style={slot.locked ? { color: token.colorPrimary, background: token.colorPrimaryBg } : undefined}
										onClick={() => update(slot.file, slot.nodeId, { locked: !slot.locked })}
									/>
								</Tooltip>
								<Tooltip title={t("approval.signSlots.remove")}>
									<Button
										size="small"
										type="text"
										danger
										aria-label={t("approval.signSlots.remove")}
										icon={<DeleteOutlined />}
										onClick={() => remove(slot.file, slot.nodeId)}
									/>
								</Tooltip>
							</div>
						</SignatureBox>
					);
				})}
			</PlacementLayer>
		);
	};

	const sectionLabel = (text: string) => (
		<span className="text-xs font-semibold uppercase tracking-wide" style={{ color: token.colorTextSecondary }}>{text}</span>
	);

	return (
		<div className="flex h-full flex-col md:flex-row">
			<div className="flex h-full w-full flex-col md:w-[320px] md:shrink-0" style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}>
				<div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
					<div className="flex flex-col gap-2">
						{sectionLabel(t("approval.sign.documents"))}
						{documents.map((item) => {
							const selected = item.id === fileId;
							const placed = steps.filter(step => slots[keyOf(item.id, step.nodeId)]).length;
							const done = steps.length > 0 && placed === steps.length;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setFileId(item.id)}
									className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left"
									style={{
										border: `1px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
										background: selected ? token.colorPrimaryBg : token.colorBgContainer,
										color: token.colorText,
									}}
								>
									<FilePdfOutlined style={{ color: token.colorError }} />
									<span className="min-w-0 flex-1 truncate text-[13px]">{item.filename}</span>
									<span className="flex items-center gap-1 text-xs" style={done ? { color: token.colorSuccess, fontWeight: 600 } : { color: token.colorTextSecondary }}>
										{done && <CheckOutlined />}
										{`${placed}/${steps.length}`}
									</span>
								</button>
							);
						})}
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-baseline justify-between gap-2">
							{sectionLabel(t("approval.signSlots.steps"))}
							<span className="text-xs" style={{ color: token.colorTextSecondary }}>{t("approval.signSlots.hint")}</span>
						</div>
						{steps.map((step, index) => {
							const slot = fileId ? slots[keyOf(fileId, step.nodeId)] : undefined;
							const selected = step.nodeId === nodeId;
							const color = colorOf(step.nodeId);
							return (
								<button
									key={step.nodeId}
									type="button"
									className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left"
									style={{
										border: `1px ${slot ? "solid" : "dashed"} ${selected ? color : token.colorBorder}`,
										background: selected ? `color-mix(in srgb, ${color} 8%, ${token.colorBgContainer})` : token.colorBgContainer,
										boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${color} 15%, transparent)` : undefined,
										color: token.colorText,
									}}
									onClick={() => {
										setNodeId(step.nodeId);
										if (slot)
											setFocus({ page: slot.placement.page });
									}}
								>
									<span
										className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
										style={slot ? { background: color, color: "#fff" } : { border: `1.5px solid ${color}`, color }}
									>
										{index + 1}
									</span>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className="truncate text-[13px] font-semibold">{approversLabel(step)}</span>
										<span className="truncate text-xs" style={{ color: token.colorTextSecondary }}>{step.name}</span>
									</span>
									{slot
										? (
											<span className="flex shrink-0 items-center gap-1 text-xs" style={{ color: selected ? color : token.colorTextSecondary }}>
												{slot.locked && <LockOutlined aria-label={t("approval.signSlots.lock")} />}
												{t("approval.sign.page", { page: slot.placement.page })}
											</span>
										)
										: <span className="shrink-0 text-xs" style={{ color: token.colorTextTertiary }}>{t("approval.signSlots.notPlaced")}</span>}
								</button>
							);
						})}
					</div>

					<div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ background: token.colorFillQuaternary, color: token.colorTextSecondary }}>
						{t("approval.signSlots.note")}
					</div>
				</div>

				<div className="flex gap-2 px-4 py-3" style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}>
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
