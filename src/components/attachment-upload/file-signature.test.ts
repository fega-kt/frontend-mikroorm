import { describe, expect, it } from "vitest";
import { isValidFileContent } from "./file-signature";

function fileOf(name: string, bytes: number[] | string | Uint8Array) {
	return new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], name);
}

/** ZIP tối giản (không nén, nội dung rỗng) chứa các mục có tên cho trước */
function zipOf(names: string[]) {
	const u16 = (out: number[], n: number) => out.push(n & 0xFF, (n >> 8) & 0xFF);
	const u32 = (out: number[], n: number) => {
		u16(out, n & 0xFFFF);
		u16(out, (n >>> 16) & 0xFFFF);
	};
	const local: number[] = [];
	const central: number[] = [];
	for (const name of names) {
		const bytes = [...new TextEncoder().encode(name)];
		const offset = local.length;
		u32(local, 0x04034B50);
		[20, 0, 0, 0, 0].forEach(n => u16(local, n));
		[0, 0, 0].forEach(n => u32(local, n));
		[bytes.length, 0].forEach(n => u16(local, n));
		local.push(...bytes);
		u32(central, 0x02014B50);
		[20, 20, 0, 0, 0, 0].forEach(n => u16(central, n));
		[0, 0, 0].forEach(n => u32(central, n));
		[bytes.length, 0, 0, 0, 0].forEach(n => u16(central, n));
		[0, offset].forEach(n => u32(central, n));
		central.push(...bytes);
	}
	const eocd: number[] = [];
	u32(eocd, 0x06054B50);
	[0, 0, names.length, names.length].forEach(n => u16(eocd, n));
	[central.length, local.length].forEach(n => u32(eocd, n));
	u16(eocd, 0);
	return new Uint8Array([...local, ...central, ...eocd]);
}

const DOCX_PARTS = ["[Content_Types].xml", "_rels/.rels", "word/document.xml"];

describe("isValidFileContent", () => {
	it("file text đổi đuôi .docx: không hợp lệ", async () => {
		expect(await isValidFileContent(fileOf("100mb.docx", "examplefile.com - Sample Files\n"))).toBe(false);
	});

	it("docx đủ thành phần, doc (OLE2), pdf: hợp lệ", async () => {
		expect(await isValidFileContent(fileOf("a.docx", zipOf(DOCX_PARTS)))).toBe(true);
		expect(await isValidFileContent(fileOf("a.DOC", [0xD0, 0xCF, 0x11, 0xE0, 0xA1]))).toBe(true);
		expect(await isValidFileContent(fileOf("a.pdf", "%PDF-1.7"))).toBe(true);
	});

	it("file ZIP thường / xlsx đổi đuôi .docx: không hợp lệ", async () => {
		expect(await isValidFileContent(fileOf("a.docx", zipOf(["anh.png", "bao-cao.pdf"])))).toBe(false);
		expect(await isValidFileContent(fileOf("a.docx", zipOf(["[Content_Types].xml", "xl/workbook.xml"])))).toBe(false);
	});

	it("docx bị cắt cụt: không hợp lệ", async () => {
		const docx = zipOf(DOCX_PARTS);
		expect(await isValidFileContent(fileOf("a.docx", docx.subarray(0, docx.length - 10)))).toBe(false);
	});

	it("doc mang vỏ ZIP (docx đổi đuôi .doc): không hợp lệ", async () => {
		expect(await isValidFileContent(fileOf("a.doc", zipOf(DOCX_PARTS)))).toBe(false);
	});

	it("đuôi không kiểm (ảnh, txt…): luôn hợp lệ", async () => {
		expect(await isValidFileContent(fileOf("a.txt", "hello"))).toBe(true);
		expect(await isValidFileContent(fileOf("a.png", "not a png"))).toBe(true);
	});
});
