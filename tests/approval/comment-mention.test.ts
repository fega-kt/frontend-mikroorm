import { COMMENT_MENTION_OPTIONS } from "#src/pages/approval/request-detail/components/comments/mentions";
import Mention from "@tiptap/extension-mention";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

const doc = {
	type: "doc",
	content: [{
		type: "paragraph",
		content: [
			{ type: "text", text: "Nhờ " },
			{ type: "mention", attrs: { id: "u1", label: "Trần Bình", mentionSuggestionChar: "@" } },
			{ type: "text", text: " xem" },
		],
	}],
};

const editors: Editor[] = [];

/** Editor của test: hủy sau mỗi test để timer nền của ProseMirror không chạy khi môi trường DOM đã đóng ("document is not defined") */
function makeEditor() {
	const editor = new Editor({
		element: document.createElement("div"),
		extensions: [StarterKit, Mention.configure(COMMENT_MENTION_OPTIONS)],
		content: doc,
	});
	editors.push(editor);
	return editor;
}

afterEach(() => {
	editors.splice(0).forEach(editor => editor.destroy());
});

function pressBackspace(editor: Editor) {
	return editor.view.someProp("handleKeyDown", handler => handler(editor.view, new KeyboardEvent("keydown", { key: "Backspace" })));
}

function mentionIds(editor: Editor) {
	const ids: string[] = [];
	editor.state.doc.descendants((node) => {
		if (node.type.name === "mention")
			ids.push(node.attrs.id as string);
	});
	return ids;
}

describe("comment @mention chip", () => {
	it("renders as @name in the plain text sent to the backend", () => {
		expect(makeEditor().getText()).toBe("Nhờ @Trần Bình xem");
	});

	it("is removed whole by one Backspace right after it (not turned back into an @)", () => {
		const editor = makeEditor();
		// Con trỏ ngay sau cụm: "Nhờ " (4) + cụm (1) = vị trí 1 + 4 + 1
		editor.commands.setTextSelection(6);
		expect(mentionIds(editor)).toEqual(["u1"]);
		pressBackspace(editor);
		expect(mentionIds(editor)).toEqual([]);
		expect(editor.getText()).toBe("Nhờ  xem");
	});
});
