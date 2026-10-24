import type { SignaturePlacement, SigningDocument, SigningPreparation } from "#src/api/signing-certificate";
import type { PdfPageOverlayInfo } from "#src/components/file-viewer/pdf/pdf-view";
import type { PinInputRef } from "#src/components/pin-input";
import { approvalTaskService } from "#src/api/approval-task";
import { FileContextType } from "#src/api/file-view";
import { signingCertificateService } from "#src/api/signing-certificate";
import { PdfFileView } from "#src/components/file-viewer";
import { PIN_PATTERN, PinInput } from "#src/components/pin-input";
import { AimOutlined, CheckCircleFilled, DragOutlined, FilePdfOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Modal, Spin, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SignatureAppearance } from "./signature-appearance";
import { SIGNATURE_HEIGHT, SIGNATURE_MAX_SCALE, SIGNATURE_MIN_SCALE, SIGNATURE_WIDTH } from "./signature-size";

const { Text } = Typography;

/** Trang chữ ký số của tôi (tab trong hồ sơ cá nhân) */
const SIGNATURE_PROFILE_PATH = "/personal-center/my-profile?tab=signature";

interface SignApproveModalProps {
	requestId: string
	open: boolean
	onClose: () => void
	/** Đã ký và duyệt xong (hoặc văn bản đã được chuyển sang PDF): tải lại chi tiết tờ trình */
	onChanged: () => void
}

export interface SignatureBoxProps {
	placement: SignaturePlacement
	info: PdfPageOverlayInfo
	signatureImage?: string | null
	lines?: string[]
	/** Nội dung thay cho khung chữ ký mẫu (màn đặt vị trí ký của người trình) */
	content?: React.ReactNode
	/** Người trình đã khóa khung: không kéo / phóng được */
	locked?: boolean
	onMove: (placement: SignaturePlacement) => void
}

const SIGNATURE_RATIO = SIGNATURE_WIDTH / SIGNATURE_HEIGHT;

/**
 * Khung chữ ký trên một trang (tọa độ PDF gốc dưới-trái ↔ px CSS gốc trên-trái): kéo khung để đổi vị trí, kéo tay nắm góc
 * dưới phải để phóng to / thu nhỏ (giữ tỉ lệ, góc trên trái đứng yên, trong khoảng min–max và trong trang).
 * Bên trong là khung đúng như bản ký; viền xanh bao ngoài và tay nắm chỉ để thao tác, không có trong bản ký.
 */
export function SignatureBox({ placement, info, signatureImage = null, lines = [], content, locked, onMove }: SignatureBoxProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { scale, size } = info;
	const drag = useRef<{ x: number, y: number, start: SignaturePlacement, mode: "move" | "resize" }>(undefined);
	const [mode, setMode] = useState<"move" | "resize">();

	const startDrag = (dragMode: "move" | "resize") => (event: React.PointerEvent<HTMLElement>) => {
		event.stopPropagation();
		if (locked)
			return;
		event.currentTarget.setPointerCapture(event.pointerId);
		drag.current = { x: event.clientX, y: event.clientY, start: placement, mode: dragMode };
		setMode(dragMode);
	};
	const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
		if (!drag.current)
			return;
		const { start } = drag.current;
		const dx = (event.clientX - drag.current.x) / scale;
		const dy = (event.clientY - drag.current.y) / scale;
		if (drag.current.mode === "move") {
			onMove({
				...start,
				x: Math.min(Math.max(0, start.x + dx), size.width - start.width),
				// Trục y của PDF hướng lên: kéo xuống (dy > 0) là giảm y
				y: Math.min(Math.max(0, start.y - dy), size.height - start.height),
			});
			return;
		}
		// Giữ tỉ lệ: lấy trung bình độ rộng suy ra từ kéo ngang và kéo dọc; góc trên trái (x, y + height) đứng yên
		const wanted = ((start.width + dx) + (start.height + dy) * SIGNATURE_RATIO) / 2;
		const insidePage = Math.min(size.width - start.x, (start.y + start.height) * SIGNATURE_RATIO);
		const width = Math.min(Math.max(wanted, SIGNATURE_WIDTH * SIGNATURE_MIN_SCALE), SIGNATURE_WIDTH * SIGNATURE_MAX_SCALE, insidePage);
		const height = width / SIGNATURE_RATIO;
		onMove({ ...start, width, height, y: start.y + start.height - height });
	};
	const onPointerUp = () => {
		drag.current = undefined;
		setMode(undefined);
	};
	const active = !!mode;

	return (
		<div
			role="button"
			aria-label="signature"
			className={`absolute touch-none select-none ${locked ? "cursor-default" : "cursor-move"}`}
			style={{
				left: placement.x * scale,
				top: (size.height - placement.y - placement.height) * scale,
				width: placement.width * scale,
				height: placement.height * scale,
				borderRadius: 2 * scale,
				outline: `${active ? "2px solid" : "1.5px dashed"} ${token.colorPrimary}`,
				outlineOffset: 3,
				boxShadow: active ? `0 6px 18px color-mix(in srgb, ${token.colorPrimary} 30%, transparent)` : "none",
			}}
			onClick={event => event.stopPropagation()}
			onPointerDown={startDrag("move")}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{content ?? <SignatureAppearance width={placement.width} height={placement.height} scale={scale} lines={lines} signatureImage={signatureImage} />}
			{mode === "move" && (
				<span
					className="pointer-events-none absolute flex size-6 items-center justify-center rounded-full text-white"
					style={{ right: -12, top: -12, background: token.colorPrimary, boxShadow: token.boxShadowSecondary }}
				>
					<DragOutlined />
				</span>
			)}
			{/* Tay nắm phóng to / thu nhỏ: vùng bấm 20px, ô vuông hiện ra 10px */}
			{!locked && (
				<span
					aria-label={t("approval.sign.resize")}
					title={t("approval.sign.resize")}
					className="absolute flex size-5 cursor-nwse-resize touch-none items-center justify-center"
					style={{ right: -13, bottom: -13 }}
					// Di chuyển / thả nổi bọt lên khung (đã có handler)
					onPointerDown={startDrag("resize")}
				>
					<span className="block size-2.5 rounded-sm" style={{ background: token.colorBgContainer, border: `1.5px solid ${token.colorPrimary}` }} />
				</span>
			)}
		</div>
	);
}

/**
 * "Ký và duyệt" ở bước bắt buộc ký số: chọn vị trí chữ ký trên từng văn bản (kéo thả; không chọn thì tự xếp
 * ở chân trang cuối), bấm ký thì hộp xác nhận hỏi PIN rồi ký + duyệt trong một lần. Mở hộp này backend đã chuyển Word/Excel sang PDF.
 */
type SignApproveBodyProps = Omit<SignApproveModalProps, "open"> & {
	/** Đang ký: chặn đóng hộp giữa chừng */
	onSubmitting: (submitting: boolean) => void
};

/** Nội dung hộp: Modal hủy khi đóng nên mỗi lần mở là một lượt chuẩn bị mới (không phải reset state) */
function SignApproveBody({ requestId, onClose, onChanged, onSubmitting }: SignApproveBodyProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const [prep, setPrep] = useState<SigningPreparation>();
	const [signatureImage, setSignatureImage] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [selectedId, setSelectedId] = useState<string>();
	const [placements, setPlacements] = useState<Record<string, SignaturePlacement>>({});
	/** Trang cần cuộn tới trong khung xem (trang có khung chữ ký của văn bản đang chọn) */
	const [focus, setFocus] = useState<{ page: number }>();
	/** Tệp PDF đã mở xong trong khung xem (đổi văn bản thì phải chờ tệp mới mở xong) */
	const [loadedFileId, setLoadedFileId] = useState<string>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pin, setPin] = useState("");
	const [pinError, setPinError] = useState<string>();
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const pinRef = useRef<PinInputRef>(null);

	useEffect(() => {
		let cancelled = false;
		Promise.all([approvalTaskService.fetchPrepareSigning(requestId), signingCertificateService.fetchMine()])
			.then(([result, mine]) => {
				if (cancelled)
					return;
				setPrep(result);
				// Ảnh đã được service ký số cắt sát nét, đúng như ảnh sẽ đóng vào khung khi ký
				setSignatureImage(mine?.signatureImage ?? null);
				// Khung người trình đặt sẵn cho bước này được ưu tiên hơn vị trí tự xếp
				const signable = result.documents.filter(doc => doc.signable && (doc.preset || doc.auto));
				setPlacements(Object.fromEntries(signable.map(doc => [doc.id, (doc.preset?.placement ?? doc.auto)!])));
				setSelectedId(signable[0]?.id);
				const first = signable[0] && (signable[0].preset?.placement ?? signable[0].auto);
				if (first)
					setFocus({ page: first.page });
				// Văn bản Word/Excel vừa được chuyển sang PDF → chi tiết tờ trình cũng đổi
				onChanged();
			})
			.catch(() => !cancelled && setFailed(true));
		return () => {
			cancelled = true;
		};
		// Chỉ chuẩn bị một lần khi mở hộp
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requestId]);

	const signable = prep?.documents.filter(doc => doc.signable) ?? [];
	const selected = signable.find(doc => doc.id === selectedId);
	const previewLines = prep?.signatureLines ?? [];

	/** Chọn văn bản: cuộn tới trang đang đặt khung chữ ký của văn bản đó */
	const selectDocument = (doc: SigningDocument) => {
		setSelectedId(doc.id);
		setFocus({ page: placements[doc.id]?.page ?? 1 });
	};

	/** Bấm "Ký và duyệt": hỏi PIN trong hộp xác nhận, PIN chỉ nhập lúc ký */
	const openConfirm = () => {
		setPin("");
		setPinError(undefined);
		setConfirmOpen(true);
	};

	const submit = async (value = pin) => {
		if (!PIN_PATTERN.test(value)) {
			setPinError(t("personal-center.signature.pinInvalid"));
			return;
		}
		setSubmitting(true);
		onSubmitting(true);
		try {
			await approvalTaskService.fetchSignApprove(requestId, { pin: value, comment: comment.trim() || undefined, placements });
			window.$message?.success(t("approval.messages.signedApproved"));
			setConfirmOpen(false);
			onClose();
			onChanged();
		}
		catch (error) {
			// Lỗi đã được interceptor hiển thị; sai PIN thì giữ hộp xác nhận, xóa ô PIN và báo số lần còn lại
			const body = await (error as { response?: Response }).response?.clone().json().catch(() => undefined) as { code?: string, remainingAttempts?: number } | undefined;
			if (body?.code === "INVALID_PIN") {
				setPin("");
				setPinError(t("approval.sign.invalidPin", { count: body.remainingAttempts ?? 0 }));
				pinRef.current?.focus();
			}
			else if (body?.code === "PIN_LOCKED") {
				setPin("");
				setPinError(t("approval.sign.pinLocked"));
			}
		}
		finally {
			setSubmitting(false);
			onSubmitting(false);
		}
	};

	const renderOverlay = (doc: SigningDocument) => (info: PdfPageOverlayInfo) => {
		const placement = placements[doc.id];
		const existing = doc.pages?.find(page => page.page === info.pageNumber)?.signatures ?? [];
		// Nhấp vào chỗ trống trên trang: đưa khung chữ ký tới đó (căn giữa theo điểm nhấp)
		const placeAt = (event: React.MouseEvent<HTMLDivElement>) => {
			if (!placement || doc.preset?.locked)
				return;
			const rect = event.currentTarget.getBoundingClientRect();
			const x = (event.clientX - rect.left) / info.scale - placement.width / 2;
			const y = info.size.height - (event.clientY - rect.top) / info.scale - placement.height / 2;
			setPlacements(prev => ({
				...prev,
				[doc.id]: {
					...placement,
					page: info.pageNumber,
					x: Math.min(Math.max(0, x), info.size.width - placement.width),
					y: Math.min(Math.max(0, y), info.size.height - placement.height),
				},
			}));
		};
		return (
			<div className={`absolute inset-0 ${doc.preset?.locked ? "" : "cursor-copy"}`} onClick={placeAt}>
				{existing.map(([llx, lly, urx, ury]) => (
					<div
						key={`${llx}-${lly}`}
						className="pointer-events-none absolute flex items-start justify-end p-0.5"
						style={{
							left: llx * info.scale,
							top: (info.size.height - ury) * info.scale,
							width: (urx - llx) * info.scale,
							height: (ury - lly) * info.scale,
							border: `1px dashed ${token.colorTextQuaternary}`,
							background: "rgb(0 0 0 / 0.03)",
						}}
					>
						<CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 12 }} />
					</div>
				))}
				{placement?.page === info.pageNumber && (
					<SignatureBox
						placement={placement}
						info={info}
						signatureImage={signatureImage}
						lines={previewLines}
						locked={doc.preset?.locked}
						onMove={next => setPlacements(prev => ({ ...prev, [doc.id]: next }))}
					/>
				)}
			</div>
		);
	};

	const noCertificate = prep && !prep.certificate;
	const selectedFileId = selected && (selected.fileId ?? selected.id);
	// Chờ văn bản đang xem mở xong: người ký phải thấy văn bản và vị trí khung chữ ký trước khi ký
	const viewerReady = !!selectedFileId && loadedFileId === selectedFileId;
	const canSubmit = !!prep?.certificate && signable.length > 0 && viewerReady && !submitting;

	const sidebar = prep && (
		<div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:w-[340px] md:shrink-0" style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}>
			{noCertificate && (
				<Alert
					type="warning"
					showIcon
					icon={<SafetyCertificateOutlined />}
					message={t("approval.sign.noCertificate")}
					description={t("approval.sign.noCertificateHint")}
					action={<Button size="small" onClick={() => navigate(SIGNATURE_PROFILE_PATH)}>{t("approval.sign.register")}</Button>}
				/>
			)}
			{!signable.length && <Alert type="info" showIcon message={t("approval.sign.noDocument")} />}

			<div className="flex flex-col gap-1.5">
				<Text strong>{t("approval.sign.documents")}</Text>
				{prep.documents.map((doc) => {
					const placement = placements[doc.id];
					const active = doc.id === selectedId;
					return (
						<button
							key={doc.id}
							type="button"
							disabled={!doc.signable}
							onClick={() => selectDocument(doc)}
							className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left disabled:cursor-not-allowed"
							style={{
								border: `1px solid ${active ? token.colorPrimary : token.colorBorderSecondary}`,
								background: active ? token.colorPrimaryBg : token.colorBgContainer,
								color: doc.signable ? token.colorText : token.colorTextDisabled,
							}}
						>
							<FilePdfOutlined style={{ color: doc.signable ? token.colorError : token.colorTextDisabled }} />
							<span className="min-w-0 flex-1 truncate text-[13px]">{doc.filename}</span>
							{doc.signable
								? <Tag className="m-0" bordered={false}>{t("approval.sign.page", { page: placement?.page ?? "—" })}</Tag>
								: <Tag className="m-0" bordered={false}>{t("approval.sign.notSignable")}</Tag>}
						</button>
					);
				})}
			</div>

			{selected && (
				<div className="flex flex-col gap-1.5 text-xs" style={{ color: token.colorTextSecondary }}>
					<span>{selected.preset?.locked ? t("approval.sign.lockedHint") : selected.preset ? t("approval.sign.presetHint") : t("approval.sign.placementHint")}</span>
					{!selected.preset?.locked && (
						<Button
							size="small"
							icon={<AimOutlined />}
							className="self-start"
							onClick={() => {
								const reset = selected.preset?.placement ?? selected.auto;
								if (!reset)
									return;
								setPlacements(prev => ({ ...prev, [selected.id]: reset }));
								setFocus({ page: reset.page });
							}}
						>
							{t("approval.sign.resetPlacement")}
						</Button>
					)}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Text strong>{t("approval.fields.comment")}</Text>
				<Input.TextArea
					value={comment}
					onChange={event => setComment(event.target.value)}
					maxLength={2000}
					autoSize={{ minRows: 2, maxRows: 5 }}
					placeholder={t("approval.detail.commentPlaceholder")}
				/>
			</div>

			<div className="flex-1" />
			<Button type="primary" size="large" block disabled={!canSubmit} loading={!!selected && !viewerReady} onClick={openConfirm}>
				{t("approval.actions.signApprove")}
			</Button>
		</div>
	);

	const confirmModal = prep && (
		<Modal
			open={confirmOpen}
			title={t("approval.sign.confirmTitle")}
			onCancel={submitting ? undefined : () => setConfirmOpen(false)}
			closable={!submitting}
			maskClosable={false}
			afterOpenChange={visible => visible && pinRef.current?.focus()}
			width={420}
			footer={[
				<Button key="cancel" disabled={submitting} onClick={() => setConfirmOpen(false)}>{t("common.cancel")}</Button>,
				<Button key="sign" type="primary" loading={submitting} disabled={!PIN_PATTERN.test(pin)} onClick={() => submit()}>{t("approval.sign.confirm")}</Button>,
			]}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Text type="secondary" className="text-[13px]">{t("approval.sign.confirmDescription", { count: signable.length })}</Text>
					{signable.map(doc => (
						<div key={doc.id} className="flex items-center gap-2 text-[13px]">
							<FilePdfOutlined style={{ color: token.colorError }} />
							<span className="min-w-0 flex-1 truncate">{doc.filename}</span>
							<Tag className="m-0" bordered={false}>{t("approval.sign.page", { page: placements[doc.id]?.page ?? "—" })}</Tag>
						</div>
					))}
				</div>
				<div className="flex flex-col gap-1.5">
					<Text strong>{t("personal-center.signature.pin")}</Text>
					<PinInput
						ref={pinRef}
						value={pin}
						onChange={(value) => {
							setPin(value);
							setPinError(undefined);
							// Nhập đủ 6 số là ký luôn
							if (PIN_PATTERN.test(value) && !submitting)
								void submit(value);
						}}
						status={pinError ? "error" : undefined}
						disabled={submitting}
					/>
					{pinError && <Text type="danger" className="text-xs">{pinError}</Text>}
				</div>
				<Text type="secondary" className="text-xs">
					{t("approval.sign.legalHint", { date: prep.certificate?.notAfter ? dayjs(prep.certificate.notAfter).format("DD/MM/YYYY") : "—" })}
				</Text>
			</div>
		</Modal>
	);

	if (failed) {
		return (
			<div className="p-6">
				<Alert type="error" showIcon message={t("approval.sign.prepareFailed")} />
			</div>
		);
	}
	if (!prep) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<Spin />
				<Text type="secondary">{t("approval.sign.preparing")}</Text>
			</div>
		);
	}
	return (
		<div className="flex h-full flex-col md:flex-row">
			{sidebar}
			{confirmModal}
			<div className="min-h-0 min-w-0 flex-1 max-md:hidden">
				{selected
					? (
						<PdfFileView
							key={selectedFileId}
							target={{ contextType: FileContextType.ApprovalRequest, fileId: selectedFileId!, filename: selected.filename }}
							renderPageOverlay={renderOverlay(selected)}
							focusPage={focus}
							onLoad={() => setLoadedFileId(selectedFileId)}
						/>
					)
					: <div className="flex h-full items-center justify-center" style={{ color: token.colorTextTertiary }}>{t("approval.sign.noDocument")}</div>}
			</div>
		</div>
	);
}

export function SignApproveModal({ requestId, open, onClose, onChanged }: SignApproveModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [submitting, setSubmitting] = useState(false);
	return (
		<Modal
			open={open}
			title={t("approval.sign.title")}
			footer={null}
			onCancel={submitting ? undefined : onClose}
			closable={!submitting}
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
			<SignApproveBody requestId={requestId} onClose={onClose} onChanged={onChanged} onSubmitting={setSubmitting} />
		</Modal>
	);
}
