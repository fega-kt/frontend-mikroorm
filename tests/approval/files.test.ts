import type { FileBlockConfig } from "#src/api/setting/request-type/types";
import { FileKind } from "#src/api/setting/request-type/types";
import { acceptFor, checkFileBlock } from "#src/pages/approval/lib/files";
import { describe, expect, it } from "vitest";

const MB = 1024 * 1024;
function block(patch: Partial<FileBlockConfig> = {}): FileBlockConfig {
	return {
		enabled: true,
		required: false,
		minFiles: 1,
		maxFiles: 5,
		maxSizeMb: 10,
		fileTypes: [FileKind.Pdf, FileKind.Word],
		...patch,
	};
}

// Cùng các ca với backend attachment-config.spec.ts
describe("file block check (FE)", () => {
	it("builds the accept string from file kinds", () => {
		expect(acceptFor([FileKind.Pdf, FileKind.Word])).toBe(".pdf,.doc,.docx");
	});

	it("requires at least minFiles when required", () => {
		expect(checkFileBlock(block({ required: true, minFiles: 2 }), [{ filename: "a.pdf", size: MB }])).toEqual({ code: "MIN_FILES", min: 2 });
		expect(checkFileBlock(block({ required: false }), [])).toBeNull();
	});

	it("limits the number of files", () => {
		const files = [{ filename: "a.pdf", size: 1 }, { filename: "b.pdf", size: 1 }];
		expect(checkFileBlock(block({ maxFiles: 1 }), files)).toEqual({ code: "MAX_FILES", max: 1 });
	});

	it("checks type by extension and size", () => {
		expect(checkFileBlock(block(), [{ filename: "x.PNG", size: 1 }])).toEqual({ code: "FILE_TYPE", filename: "x.PNG" });
		expect(checkFileBlock(block({ maxSizeMb: 2 }), [{ filename: "big.docx", size: 3 * MB }])).toEqual({ code: "FILE_SIZE", filename: "big.docx", max: 2 });
		expect(checkFileBlock(block(), [{ filename: "ok.DOCX", size: MB }])).toBeNull();
	});

	it("ignores a disabled block", () => {
		expect(checkFileBlock(block({ enabled: false, required: true }), [])).toBeNull();
	});
});
