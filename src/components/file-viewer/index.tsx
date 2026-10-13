import type { FileContextType, FileViewDescriptor } from "#src/api/file-view";
import { FileViewKind, fileViewService } from "#src/api/file-view";
import { Alert, Empty, Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

function FileViewBody({ target }: { target: FileViewTarget }) {
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
	}, [target]);

	const streamUrl = descriptor?.streamPath ? fileViewService.buildStreamUrl(target.contextType, descriptor.streamPath) : undefined;
	// Chặn menu chuột phải (lưu ảnh / video) — chỉ là rào cản giao diện, không thay thế quyền truy cập ở backend
	const blockMenu = (event: React.SyntheticEvent) => event.preventDefault();

	if (error)
		return <Alert type="error" showIcon message={t("approval.files.viewError")} />;
	if (!descriptor)
		return <div className="flex h-full items-center justify-center"><Spin /></div>;
	if (descriptor.kind === FileViewKind.Office)
		return <OfficeView descriptor={descriptor} />;
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
	return <Empty className="mt-16" description={t("approval.files.viewUnsupported")} />;
}

/** Xem tệp của tờ trình trong cửa sổ: không có nút tải; OnlyOffice cho văn phòng/PDF, thẻ gốc cho ảnh/video/âm thanh */
export function FileViewer({ target, onClose }: FileViewerProps) {
	return (
		<Modal
			open={!!target}
			title={target?.filename}
			footer={null}
			onCancel={onClose}
			destroyOnHidden
			// Toàn màn hình để đủ chỗ đọc tài liệu
			width="100vw"
			style={{ top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
			styles={{
				wrapper: { padding: 0 },
				container: { height: "100vh", padding: 0, borderRadius: 0, display: "flex", flexDirection: "column" },
				header: { padding: "12px 20px", margin: 0 },
				body: { padding: 0, flex: 1, minHeight: 0, overflow: "hidden" },
			}}
		>
			{/* key theo tệp: mỗi lần mở tệp khác là một lượt tải mới, không phải reset state thủ công */}
			{target && <FileViewBody key={target.fileId} target={target} />}
		</Modal>
	);
}
