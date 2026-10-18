import type { SignaturePlacement, SigningDocument, SigningPreparation } from "#src/api/signing-certificate";
import type { PdfPageOverlayInfo } from "#src/components/file-viewer/pdf/pdf-view";
import { approvalTaskService } from "#src/api/approval-task";
import { FileContextType } from "#src/api/file-view";
import { signingCertificateService } from "#src/api/signing-certificate";
import { PdfFileView } from "#src/components/file-viewer";
import { useUserStore } from "#src/store/user";
import { AimOutlined, CheckCircleFilled, FilePdfOutlined, LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Modal, Spin, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const { Text } = Typography;

const PIN_PATTERN = /^\d{6,12}$/;
/** Trang chữ ký số của tôi (tab trong hồ sơ cá nhân) */
const SIGNATURE_PROFILE_PATH = "/personal-center/my-profile?tab=signature";

interface SignApproveModalProps {
	requestId: string
	open: boolean
	onClose: () => void
	/** Đã ký và duyệt xong (hoặc văn bản đã được chuyển sang PDF): tải lại chi tiết tờ trình */
	onChanged: () => void
}

interface SignatureBoxProps {
	placement: SignaturePlacement
	info: PdfPageOverlayInfo
	signatureImage: string | null
	lines: string[]
	onMove: (placement: SignaturePlacement) => void
}

/** Khung chữ ký kéo thả được trên một trang (tọa độ PDF gốc dưới-trái ↔ px CSS gốc trên-trái) */
function SignatureBox({ placement, info, signatureImage, lines, onMove }: SignatureBoxProps) {
	const { token } = theme.useToken();
	const { scale, size } = info;
	const drag = useRef<{ x: number, y: number, start: SignaturePlacement }>(undefined);

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		drag.current = { x: event.clientX, y: event.clientY, start: placement };
	};
	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!drag.current)
			return;
		const { start } = drag.current;
		const dx = (event.clientX - drag.current.x) / scale;
		const dy = (event.clientY - drag.current.y) / scale;
		onMove({
			...start,
			x: Math.min(Math.max(0, start.x + dx), size.width - start.width),
			// Trục y của PDF hướng lên: kéo xuống (dy > 0) là giảm y
			y: Math.min(Math.max(0, start.y - dy), size.height - start.height),
		});
	};
	const onPointerUp = () => {
		drag.current = undefined;
	};

	const fontSize = Math.max(6, 8 * scale);
	return (
		<div
			role="button"
			aria-label="signature"
			className="absolute flex cursor-move touch-none select-none items-stretch overflow-hidden"
			style={{
				left: placement.x * scale,
				top: (size.height - placement.y - placement.height) * scale,
				width: placement.width * scale,
				height: placement.height * scale,
				border: `1.5px solid ${token.colorPrimary}`,
				background: `color-mix(in srgb, ${token.colorPrimaryBg} 85%, transparent)`,
				borderRadius: 2,
				boxShadow: token.boxShadowSecondary,
			}}
			onClick={event => event.stopPropagation()}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{signatureImage && (
				<div className="flex w-1/2 shrink-0 items-center justify-center p-0.5">
					<img src={signatureImage} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
				</div>
			)}
			<div className="flex min-w-0 flex-1 flex-col justify-center px-1 leading-tight" style={{ fontSize, color: "#1f1f1f" }}>
				{lines.map(line => <span key={line} className="truncate">{line}</span>)}
			</div>
		</div>
	);
}

/**
 * "Ký và duyệt" ở bước bắt buộc ký số: chọn vị trí chữ ký trên từng văn bản (kéo thả; không chọn thì tự xếp
 * ở chân trang cuối), nhập PIN rồi ký + duyệt trong một lần. Mở hộp này backend đã chuyển Word/Excel sang PDF.
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
	const fullName = useUserStore(state => state.fullName);
	const [prep, setPrep] = useState<SigningPreparation>();
	const [signatureImage, setSignatureImage] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [selectedId, setSelectedId] = useState<string>();
	const [placements, setPlacements] = useState<Record<string, SignaturePlacement>>({});
	const [pin, setPin] = useState("");
	const [pinError, setPinError] = useState<string>();
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let cancelled = false;
		Promise.all([approvalTaskService.fetchPrepareSigning(requestId), signingCertificateService.fetchMine()])
			.then(([result, mine]) => {
				if (cancelled)
					return;
				setPrep(result);
				setSignatureImage(mine?.signatureImage ?? null);
				const signable = result.documents.filter(doc => doc.signable && doc.auto);
				setPlacements(Object.fromEntries(signable.map(doc => [doc.id, doc.auto!])));
				setSelectedId(signable[0]?.id);
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
	const previewLines = [t("approval.sign.signedBy", { name: fullName }), t("approval.sign.signedAtPreview")];

	const submit = async () => {
		if (!PIN_PATTERN.test(pin)) {
			setPinError(t("personal-center.signature.pinInvalid"));
			return;
		}
		setSubmitting(true);
		onSubmitting(true);
		try {
			await approvalTaskService.fetchSignApprove(requestId, { pin, comment: comment.trim() || undefined, placements });
			window.$message?.success(t("approval.messages.signedApproved"));
			onClose();
			onChanged();
		}
		catch (error) {
			// Lỗi đã được interceptor hiển thị; sai PIN thì báo thêm số lần còn lại ngay dưới ô PIN
			const body = await (error as { response?: Response }).response?.clone().json().catch(() => undefined) as { code?: string, remainingAttempts?: number } | undefined;
			if (body?.code === "INVALID_PIN")
				setPinError(t("approval.sign.invalidPin", { count: body.remainingAttempts ?? 0 }));
			else if (body?.code === "PIN_LOCKED")
				setPinError(t("approval.sign.pinLocked"));
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
			if (!placement)
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
			<div className="absolute inset-0 cursor-copy" onClick={placeAt}>
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
						onMove={next => setPlacements(prev => ({ ...prev, [doc.id]: next }))}
					/>
				)}
			</div>
		);
	};

	const noCertificate = prep && !prep.certificate;
	const canSubmit = !!prep?.certificate && signable.length > 0 && !submitting;

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
							onClick={() => setSelectedId(doc.id)}
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
					<span>{t("approval.sign.placementHint")}</span>
					<Button
						size="small"
						icon={<AimOutlined />}
						className="self-start"
						onClick={() => selected.auto && setPlacements(prev => ({ ...prev, [selected.id]: selected.auto! }))}
					>
						{t("approval.sign.resetPlacement")}
					</Button>
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

			<div className="flex flex-col gap-1.5">
				<Text strong>{t("personal-center.signature.pin")}</Text>
				<Input.Password
					value={pin}
					onChange={(event) => {
						setPin(event.target.value.replace(/\D/g, ""));
						setPinError(undefined);
					}}
					onPressEnter={() => canSubmit && submit()}
					inputMode="numeric"
					autoComplete="off"
					maxLength={12}
					prefix={<LockOutlined />}
					status={pinError ? "error" : undefined}
					disabled={!prep.certificate}
				/>
				{pinError && <Text type="danger" className="text-xs">{pinError}</Text>}
			</div>

			<div className="flex-1" />
			<Text type="secondary" className="text-xs">
				{t("approval.sign.legalHint", { date: prep.certificate?.notAfter ? dayjs(prep.certificate.notAfter).format("DD/MM/YYYY") : "—" })}
			</Text>
			<Button type="primary" size="large" block loading={submitting} disabled={!canSubmit} onClick={submit}>
				{t("approval.actions.signApprove")}
			</Button>
		</div>
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
			<div className="min-h-0 min-w-0 flex-1 max-md:hidden">
				{selected
					? (
						<PdfFileView
							key={selected.fileId ?? selected.id}
							target={{ contextType: FileContextType.ApprovalRequest, fileId: selected.fileId ?? selected.id, filename: selected.filename }}
							renderPageOverlay={renderOverlay(selected)}
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
