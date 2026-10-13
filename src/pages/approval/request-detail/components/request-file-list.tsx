import type { AttachmentEntity } from "#src/api/attachment";
import type { GlobalToken } from "antd";
import { FILE_KIND_EXTENSIONS, FileKind } from "#src/api/setting/request-type/types";
import { formatBytes } from "#src/utils/format-bytes";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, theme, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";

export type RequestFile = Pick<AttachmentEntity, "id" | "filename" | "size">;

interface RequestFileListProps {
	files: RequestFile[]
	onView: (file: RequestFile) => void
	onDownload: (file: RequestFile) => void
	/** Id tệp đang lấy link tải (hiện loading trên nút tải) */
	downloadingId?: string | null
}

const extOf = (filename: string) => (filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "");

/** Màu ô loại tệp theo nhóm (PDF đỏ, Word xanh dương, Excel xanh lá…) — lấy từ bảng màu của theme để đúng cả sáng/tối */
function kindTone(ext: string, token: GlobalToken) {
	const kind = (Object.keys(FILE_KIND_EXTENSIONS) as FileKind[]).find(k => FILE_KIND_EXTENSIONS[k].includes(ext));
	switch (kind) {
		case FileKind.Pdf: return { color: token.red6, background: token.red1 };
		case FileKind.Word: return { color: token.blue6, background: token.blue1 };
		case FileKind.Excel: return { color: token.green6, background: token.green1 };
		case FileKind.PowerPoint: return { color: token.orange6, background: token.orange1 };
		case FileKind.Image: return { color: token.purple6, background: token.purple1 };
		case FileKind.Zip: return { color: token.gold6, background: token.gold1 };
		default: return { color: token.colorTextSecondary, background: token.colorFillSecondary };
	}
}

/** Danh sách tệp ở chế độ xem: ô loại tệp, tên (bấm để xem), dung lượng, nút Xem và Tải */
export function RequestFileList({ files, onView, onDownload, downloadingId }: RequestFileListProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<ul className="m-0 flex list-none flex-col p-0">
			{files.map((file) => {
				const ext = extOf(file.filename);
				return (
					<li key={file.id} className="flex items-center gap-3.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-colorFillTertiary">
						<span
							className="flex size-10 flex-none items-center justify-center rounded-lg text-[11px] font-bold tracking-wide"
							style={kindTone(ext, token)}
						>
							{ext.toUpperCase().slice(0, 4) || "FILE"}
						</span>
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<Typography.Link ellipsis className="font-medium" onClick={() => onView(file)}>
								{file.filename}
							</Typography.Link>
							<Typography.Text type="secondary" className="text-xs">
								{[ext.toUpperCase(), formatBytes(file.size)].filter(Boolean).join(" · ")}
							</Typography.Text>
						</div>
						<Button icon={<EyeOutlined />} onClick={() => onView(file)}>
							{t("approval.files.view")}
						</Button>
						<Tooltip title={t("approval.files.download")}>
							<Button
								icon={<DownloadOutlined />}
								aria-label={t("approval.files.download")}
								loading={downloadingId === file.id}
								onClick={() => onDownload(file)}
							/>
						</Tooltip>
					</li>
				);
			})}
		</ul>
	);
}
