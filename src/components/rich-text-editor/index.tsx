import type { Extensions } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { theme } from "antd";
import { useEffect, useRef } from "react";
import { Toolbar } from "./toolbar";
import "./rich-text-editor.css";

export interface RichTextEditorProps {
	/** HTML content */
	value?: string
	/** Fires on content change with HTML string */
	onChange?: (html: string) => void
	/** Placeholder text */
	placeholder?: string
	/** Min height of the editable area in px */
	minHeight?: number
	/** Whether the editor is read only */
	readOnly?: boolean
	/** Extra tiptap extensions */
	extensions?: Extensions
	/** Hide the toolbar */
	hideToolbar?: boolean
	/** CSS class for the outer wrapper */
	className?: string
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "Start writing...",
	minHeight = 160,
	readOnly = false,
	extensions: extraExtensions = [],
	hideToolbar = false,
	className,
}: RichTextEditorProps) {
	const { token } = theme.useToken();
	const isInternalUpdate = useRef(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: { keepMarks: true },
				orderedList: { keepMarks: true },
			}),
			Underline,
			Placeholder.configure({ placeholder }),
			TaskList,
			TaskItem.configure({ nested: true }),
			Link.configure({ openOnClick: false, autolink: true }),
			...extraExtensions,
		],
		content: value || "",
		editable: !readOnly,
		onUpdate: ({ editor: ed }) => {
			isInternalUpdate.current = true;
			const html = ed.getHTML();
			onChange?.(html === "<p></p>" ? "" : html);
		},
	});

	/* Sync external value → editor (e.g. form reset) */
	useEffect(() => {
		if (!editor)
			return;
		if (isInternalUpdate.current) {
			isInternalUpdate.current = false;
			return;
		}
		const currentHTML = editor.getHTML();
		const normalised = value || "";
		if (currentHTML !== normalised && normalised !== (currentHTML === "<p></p>" ? "" : currentHTML)) {
			editor.commands.setContent(normalised, { emitUpdate: false });
		}
	}, [value, editor]);

	return (
		<div
			className={`rounded-lg overflow-hidden ${className ?? ""}`}
			style={{ border: readOnly ? "none" : `1px solid ${token.colorBorder}` }}
		>
			{(!hideToolbar && !readOnly) && <Toolbar editor={editor} />}

			<EditorContent
				editor={editor}
				className="rich-text-editor-content"
				style={{ minHeight, padding: readOnly ? 0 : "12px 16px" }}
			/>
		</div>
	);
}

export default RichTextEditor;
