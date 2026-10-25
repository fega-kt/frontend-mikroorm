/**
 * Kiểm nội dung file khớp đuôi trước khi upload — báo ngay, không phải tải cả file lên rồi mới bị backend từ chối.
 * Chỉ kiểm văn bản Office / PDF (loại đem đi chuyển PDF, ký số); loại khác để backend kiểm.
 * 1. Chữ ký (magic bytes) đầu file.
 * 2. docx / xlsx / pptx (ZIP): mục lục ZIP ở cuối file phải có đủ thành phần — chặn file ZIP khác đổi đuôi, file bị cắt cụt.
 *    Chỉ đọc vài chục KB cuối; ZIP64 / mục lục quá lớn thì cho qua (backend và bước chuyển PDF vẫn kiểm).
 */

const ZIP = [0x50, 0x4B, 0x03, 0x04]; // docx / xlsx / pptx
const OLE2 = [0xD0, 0xCF, 0x11, 0xE0]; // doc / xls / ppt
const PDF = [0x25, 0x50, 0x44, 0x46]; // %PDF

const SIGNATURES: Record<string, number[]> = {
	docx: ZIP,
	xlsx: ZIP,
	pptx: ZIP,
	doc: OLE2,
	xls: OLE2,
	ppt: OLE2,
	pdf: PDF,
};

/** Thành phần bắt buộc trong ZIP theo đuôi (so không phân biệt hoa thường) */
const REQUIRED_PARTS: Record<string, string[]> = {
	docx: ["[content_types].xml", "word/document.xml"],
	xlsx: ["[content_types].xml", "xl/workbook.xml"],
	pptx: ["[content_types].xml", "ppt/presentation.xml"],
};

/** Bản ghi kết thúc ZIP (EOCD) dài 22 byte + chú thích tối đa 65535 byte */
const EOCD_MIN = 22;
const EOCD_MAX = EOCD_MIN + 0xFFFF;
const MAX_DIRECTORY_SIZE = 16 * 1024 * 1024;
const EOCD_SIG = 0x06054B50;
const ENTRY_SIG = 0x02014B50;

export const fileExtension = (filename: string) => (filename.includes(".") ? (filename.split(".").pop() ?? "").toLowerCase() : "");

const readBytes = async (file: Blob, start: number, end: number) => new DataView(await file.slice(start, end).arrayBuffer());

/** Mục lục ZIP có đủ thành phần bắt buộc không; không kiểm được (ZIP64, mục lục quá lớn) → true */
async function hasRequiredParts(file: File, required: string[]): Promise<boolean> {
	if (file.size < EOCD_MIN)
		return false;
	const tailStart = Math.max(0, file.size - EOCD_MAX);
	const tail = await readBytes(file, tailStart, file.size);
	let eocd = -1;
	for (let i = tail.byteLength - EOCD_MIN; i >= 0; i--) {
		if (tail.getUint32(i, true) === EOCD_SIG) {
			eocd = i;
			break;
		}
	}
	// Không có EOCD: file bị cắt cụt hoặc không phải ZIP
	if (eocd < 0)
		return false;

	const entries = tail.getUint16(eocd + 10, true);
	const dirSize = tail.getUint32(eocd + 12, true);
	const dirOffset = tail.getUint32(eocd + 16, true);
	if (entries === 0xFFFF || dirSize === 0xFFFFFFFF || dirOffset === 0xFFFFFFFF)
		return true;
	if (dirOffset + dirSize > tailStart + eocd)
		return false;
	if (dirSize > MAX_DIRECTORY_SIZE)
		return true;

	const dir = await readBytes(file, dirOffset, dirOffset + dirSize);
	const decoder = new TextDecoder();
	const names = new Set<string>();
	for (let pos = 0; pos + 46 <= dir.byteLength && dir.getUint32(pos, true) === ENTRY_SIG;) {
		const nameLength = dir.getUint16(pos + 28, true);
		const extraLength = dir.getUint16(pos + 30, true);
		const commentLength = dir.getUint16(pos + 32, true);
		names.add(decoder.decode(new Uint8Array(dir.buffer, pos + 46, nameLength)).toLowerCase());
		pos += 46 + nameLength + extraLength + commentLength;
	}
	return required.every(part => names.has(part));
}

/** false khi nội dung không đúng loại của đuôi (vd file text / file ZIP khác đổi đuôi thành .docx); đuôi không kiểm luôn true */
export async function isValidFileContent(file: File): Promise<boolean> {
	const ext = fileExtension(file.name);
	const signature = SIGNATURES[ext];
	if (!signature)
		return true;
	const header = new Uint8Array(await file.slice(0, signature.length).arrayBuffer());
	if (!signature.every((byte, i) => header[i] === byte))
		return false;
	return REQUIRED_PARTS[ext] ? hasRequiredParts(file, REQUIRED_PARTS[ext]) : true;
}
