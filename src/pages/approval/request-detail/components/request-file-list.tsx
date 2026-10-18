import type { AttachmentEntity } from "#src/api/attachment";
import type { GlobalToken } from "antd";
import { FILE_KIND_EXTENSIONS, FileKind } from "#src/api/setting/request-type/types";
import { theme } from "antd";
import { extOf } from "../../lib/files";

export type RequestFile = Pick<AttachmentEntity, "id" | "filename" | "size">;

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

const BADGE_SIZE = {
	default: "size-10 rounded-lg text-[11px]",
	middle: "size-8 rounded-md text-[10px]",
	small: "size-[22px] rounded text-[8px]",
};

/** Ô loại tệp (PDF, DOCX…) tô màu theo nhóm */
export function FileBadge({ filename, size = "default" }: { filename: string, size?: keyof typeof BADGE_SIZE }) {
	const { token } = theme.useToken();
	const ext = extOf(filename);
	return (
		<span
			className={`flex flex-none items-center justify-center font-bold tracking-wide ${BADGE_SIZE[size]}`}
			style={kindTone(ext, token)}
		>
			{ext.toUpperCase().slice(0, 4) || "FILE"}
		</span>
	);
}
