import type { FileContextType, FileViewDescriptor } from "#src/api/file-view";
import type { PdfPageOverlayInfo } from "./pdf/pdf-view";
import { FileViewKind, fileViewService } from "#src/api/file-view";
import { formatBytes } from "#src/utils/format-bytes";
import { DownloadOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Spin, theme } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ViewFallback } from "./view-fallback";

export interface FileViewTarget {
	/** Ngữ cảnh của tệp — chỉ để chọn backend xử lý; quyền xem do backend quyết định theo chủ sở hữu lưu trên tệp */
	contextType: FileContextType
	fileId: string
	filename: string
}

interface FileViewerProps {
	target: FileViewTarget | null
	onClose: () => void
}

interface DocEditorInstance {
	destroyEditor: () => void
}

declare global {
	interface Window {
		DocsAPI?: { DocEditor: new (elementId: string, config: Record<string, unknown>) => DocEditorInstance }
	}
}

/** pdf.js khá nặng: chỉ tải khi mở PDF */
const PdfView = lazy(() => import("./pdf/pdf-view").then(module => ({ default: module.PdfView })));

const scriptCache = new Map<string, Promise<void>>();

/** Tải api.js của Document Server một lần cho mỗi địa chỉ */
function loadDocsApi(serverUrl: string): Promise<void> {
	if (window.DocsAPI)
		return Promise.resolve();
	const cached = scriptCache.get(serverUrl);
	if (cached)
		return cached;
	const promise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = `${serverUrl}/web-apps/apps/api/documents/api.js`;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			scriptCache.delete(serverUrl);
			script.remove();
			reject(new Error("Cannot load document server"));
		};
		document.head.appendChild(script);
	});
	scriptCache.set(serverUrl, promise);
	return promise;
}

const EDITOR_ELEMENT_ID = "office-file-viewer";

function OfficeView({ descriptor }: { descriptor: FileViewDescriptor }) {
	const { t } = useTranslation();
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let editor: DocEditorInstance | undefined;
		let cancelled = false;
		loadDocsApi(descriptor.documentServerUrl!)
			.then(() => {
				if (cancelled || !window.DocsAPI)
					return;
				editor = new window.DocsAPI.DocEditor(EDITOR_ELEMENT_ID, { ...descriptor.config, width: "100%", height: "100%" });
			})
			.catch(() => !cancelled && setFailed(true));
		return () => {
			cancelled = true;
			editor?.destroyEditor();
		};
	}, [descriptor]);

	if (failed)
		return <Alert type="error" showIcon message={t("approval.files.viewError")} />;
	return <div id={EDITOR_ELEMENT_ID} className="h-full w-full" />;
}

interface FileViewBodyProps {
	target: FileViewTarget
	onLoaded: (descriptor: FileViewDescriptor) => void
	onDownload: () => Promise<void>
}

function FileViewBody({ target, onLoaded, onDownload }: FileViewBodyProps) {
	const { t } = useTranslation();
	const [descriptor, setDescriptor] = useState<FileViewDescriptor>();
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fileViewService.fetchView(target.contextType, target.fileId)
			.then((result) => {
				if (cancelled)
					return;
				setDescriptor(result);
				onLoaded(result);
			})
			.catch(() => !cancelled && setError(true));
		return () => {
			cancelled = true;
		};
		// Mỗi tệp tải một lần (component được key theo tệp)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target]);

	const streamUrl = descriptor?.streamPath ? fileViewService.buildStreamUrl(target.contextType, descriptor.streamPath) : undefined;
	// Chặn menu chuột phải (lưu ảnh / video) — chỉ là rào cản giao diện, không thay thế quyền truy cập ở backend
	const blockMenu = (event: React.SyntheticEvent) => event.preventDefault();
	/** Token stream hết hạn (xem PDF lâu): xin cách xem mới để lấy đường dẫn stream mới */
	const refreshStreamUrl = async () => {
		const next = await fileViewService.fetchView(target.contextType, target.fileId);
		return fileViewService.buildStreamUrl(target.contextType, next.streamPath!);
	};

	if (error)
		return <ViewFallback description={t("approval.files.viewError")} onDownload={onDownload} />;
	if (!descriptor)
		return <div className="flex h-full items-center justify-center"><Spin /></div>;
	if (descriptor.kind === FileViewKind.Office)
		return <OfficeView descriptor={descriptor} />;
	if (descriptor.kind === FileViewKind.Pdf && streamUrl) {
		return (
			<Suspense fallback={<div className="flex h-full items-center justify-center"><Spin /></div>}>
				<PdfView streamUrl={streamUrl} size={descriptor.size} refreshUrl={refreshStreamUrl} onDownload={onDownload} />
			</Suspense>
		);
	}
	if (descriptor.kind === FileViewKind.Image && streamUrl) {
		return (
			<div className="flex h-full items-center justify-center overflow-auto">
				<img src={streamUrl} alt={descriptor.filename} draggable={false} onContextMenu={blockMenu} className="max-h-full max-w-full object-contain" />
			</div>
		);
	}
	if (descriptor.kind === FileViewKind.Video && streamUrl) {
		return (
			<div className="flex h-full items-center justify-center">
				<video src={streamUrl} controls controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={blockMenu} className="max-h-full max-w-full" />
			</div>
		);
	}
	if (descriptor.kind === FileViewKind.Audio && streamUrl) {
		return (
			<div className="flex h-full items-center justify-center">
				<audio src={streamUrl} controls controlsList="nodownload noremoteplayback" onContextMenu={blockMenu} />
			</div>
		);
	}
	return <ViewFallback description={t("approval.files.viewUnsupported")} onDownload={onDownload} />;
}

interface PdfFileViewProps {
	target: FileViewTarget
	/** Lớp phủ trên từng trang (vd khung chữ ký kéo thả) */
	renderPageOverlay?: (info: PdfPageOverlayInfo) => React.ReactNode
	/** Nhảy tới trang (vd trang có khung chữ ký) */
	focusPage?: { page: number }
}

/** Xem một PDF trong ngữ cảnh khác (không phải cửa sổ xem tệp), vd hộp "Ký và duyệt" chọn vị trí chữ ký */
export function PdfFileView({ target, renderPageOverlay, focusPage }: PdfFileViewProps) {
	const { t } = useTranslation();
	const [descriptor, setDescriptor] = useState<FileViewDescriptor>();
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fileViewService.fetchView(target.contextType, target.fileId)
			.then(result => !cancelled && setDescriptor(result))
			.catch(() => !cancelled && setError(true));
		return () => {
			cancelled = true;
		};
	}, [target.contextType, target.fileId]);

	const download = () => fileViewService.download(target.contextType, target.fileId);
	const refreshStreamUrl = async () => {
		const next = await fileViewService.fetchView(target.contextType, target.fileId);
		return fileViewService.buildStreamUrl(target.contextType, next.streamPath!);
	};

	if (error || (descriptor && (descriptor.kind !== FileViewKind.Pdf || !descriptor.streamPath)))
		return <ViewFallback description={t("approval.files.viewError")} onDownload={download} />;
	if (!descriptor)
		return <div className="flex h-full items-center justify-center"><Spin /></div>;
	return (
		<Suspense fallback={<div className="flex h-full items-center justify-center"><Spin /></div>}>
			<PdfView
				streamUrl={fileViewService.buildStreamUrl(target.contextType, descriptor.streamPath!)}
				size={descriptor.size}
				refreshUrl={refreshStreamUrl}
				onDownload={download}
				renderPageOverlay={renderPageOverlay}
				focusPage={focusPage}
			/>
		</Suspense>
	);
}

/** Huy hiệu đuôi tệp ở header: màu theo nhóm (PDF đỏ, Word xanh dương, Excel xanh lá, PowerPoint cam) */
function FileBadge({ filename }: { filename: string }) {
	const { token } = theme.useToken();
	const ext = filename.includes(".") ? (filename.split(".").pop() ?? "").toLowerCase() : "";
	const tone = ext === "pdf"
		? { bg: token.colorErrorBg, fg: token.colorError }
		: ["doc", "docx", "txt"].includes(ext)
			? { bg: token.colorInfoBg, fg: token.colorInfo }
			: ["xls", "xlsx", "csv"].includes(ext)
				? { bg: token.colorSuccessBg, fg: token.colorSuccess }
				: ["ppt", "pptx"].includes(ext)
					? { bg: token.colorWarningBg, fg: token.colorWarning }
					: { bg: token.colorFillSecondary, fg: token.colorTextSecondary };
	return (
		<span className="flex size-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase" style={{ background: tone.bg, color: tone.fg }}>
			{ext.slice(0, 4) || "?"}
		</span>
	);
}

/**
 * Xem tệp trong cửa sổ toàn màn hình: pdf.js cho PDF, OnlyOffice cho văn phòng, thẻ gốc cho ảnh/video/âm thanh.
 * Header có nút tải xuống (link ký ngắn hạn, cùng quyền với xem).
 */
export function FileViewer({ target, onClose }: FileViewerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [loaded, setLoaded] = useState<FileViewDescriptor>();
	const [downloading, setDownloading] = useState(false);
	// Thông tin của tệp đang mở (bỏ qua kết quả của tệp mở trước đó)
	const descriptor = loaded?.fileId === target?.fileId ? loaded : undefined;

	const download = async () => {
		if (!target)
			return;
		setDownloading(true);
		try {
			await fileViewService.download(target.contextType, target.fileId);
		}
		finally {
			setDownloading(false);
		}
	};

	return (
		<Modal
			open={!!target}
			title={target && (
				// Chừa chỗ bên phải cho nút đóng của Modal
				<div className="flex min-w-0 items-center gap-3 pr-10">
					<FileBadge filename={target.filename} />
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-[15px]">{target.filename}</span>
						{descriptor && <span className="text-xs font-normal" style={{ color: token.colorTextSecondary }}>{formatBytes(descriptor.size)}</span>}
					</div>
					<div className="flex-1" />
					<Button icon={<DownloadOutlined />} loading={downloading} onClick={download}>
						<span className="max-sm:hidden">{t("common.fileViewer.download")}</span>
					</Button>
				</div>
			)}
			footer={null}
			onCancel={onClose}
			destroyOnHidden
			// Toàn màn hình để đủ chỗ đọc tài liệu
			width="100vw"
			style={{ top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
			styles={{
				wrapper: { padding: 0 },
				container: { height: "100vh", padding: 0, borderRadius: 0, display: "flex", flexDirection: "column" },
				header: { padding: "10px 16px 10px 20px", margin: 0, borderBottom: `1px solid ${token.colorBorderSecondary}` },
				body: { padding: 0, flex: 1, minHeight: 0, overflow: "hidden" },
			}}
		>
			{/* key theo tệp: mỗi lần mở tệp khác là một lượt tải mới, không phải reset state thủ công */}
			{target && <FileViewBody key={target.fileId} target={target} onLoaded={setLoaded} onDownload={download} />}
		</Modal>
	);
}
