import type { UserBrief } from "#src/api/approval-request";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { App, Avatar, Button, theme } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { COMMENT_MAX_LENGTH, COMMENT_MENTION_OPTIONS, matchesMention } from "./mentions";
import "./comment-input.css";

interface CommentInputProps {
	/** Người có thể @mention */
	candidates: UserBrief[]
	placeholder?: string
	submitText: string
	autoFocus?: boolean
	/** Gửi thành công trả true (ô nhập được xóa); lỗi thì giữ nguyên nội dung để gửi lại */
	onSubmit: (content: string, mentionIds: string[]) => Promise<boolean>
	onCancel?: () => void
}

/** Phần của tiptap Suggestion mà ô nhập dùng (không import trực tiếp vì là phụ thuộc gián tiếp) */
interface SuggestionState {
	items: UserBrief[]
	command: (attrs: { id: string, label: string }) => void
	rect: DOMRect | null
	selected: number
}

interface SuggestionRenderProps {
	items: UserBrief[]
	command: (attrs: { id: string, label: string }) => void
	clientRect?: (() => DOMRect | null) | null
}

/**
 * Ô nhập bình luận có @mention. Mỗi @mention là một cụm tô màu (nút của tiptap): Backspace sau cụm xóa cả cụm.
 * Người được nhắc lấy từ chính các cụm trong nội dung (theo id, hai người trùng tên không lẫn); chữ "@tên" gõ tay
 * mà không chọn từ danh sách thì chỉ là chữ thường, không nhắc ai.
 */
export function CommentInput({ candidates, placeholder, submitText, autoFocus, onSubmit, onCancel }: CommentInputProps) {
	const { message } = App.useApp();
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [submitting, setSubmitting] = useState(false);
	const [empty, setEmpty] = useState(true);
	const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
	// Callback của Suggestion được tạo một lần — đọc danh sách người và lựa chọn hiện tại qua ref
	const candidatesRef = useRef(candidates);
	candidatesRef.current = candidates;
	const suggestionRef = useRef<SuggestionState | null>(null);
	suggestionRef.current = suggestion;
	const submitRef = useRef<() => void>(() => undefined);

	const extensions = useMemo(() => [
		// Chỉ cần đoạn văn + chữ: tắt mọi định dạng khác
		StarterKit.configure({
			heading: false,
			blockquote: false,
			bulletList: false,
			orderedList: false,
			listItem: false,
			listKeymap: false,
			codeBlock: false,
			code: false,
			bold: false,
			italic: false,
			strike: false,
			underline: false,
			link: false,
			horizontalRule: false,
			dropcursor: false,
			gapcursor: false,
		}),
		Placeholder.configure({ placeholder: placeholder ?? "" }),
		Mention.configure({
			...COMMENT_MENTION_OPTIONS,
			suggestion: {
				// Cho phép dấu cách để lọc tiếp "@Nguyễn V…"; hết người khớp thì ẩn danh sách
				allowSpaces: true,
				items: ({ query }: { query: string }) => candidatesRef.current.filter(user => matchesMention(user.fullName, query)).slice(0, 8),
				render: () => ({
					onStart: (props: SuggestionRenderProps) => setSuggestion({ items: props.items, command: props.command, rect: props.clientRect?.() ?? null, selected: 0 }),
					onUpdate: (props: SuggestionRenderProps) => setSuggestion(prev => ({ items: props.items, command: props.command, rect: props.clientRect?.() ?? null, selected: prev ? Math.min(prev.selected, Math.max(props.items.length - 1, 0)) : 0 })),
					onKeyDown: ({ event }: { event: KeyboardEvent }) => {
						const state = suggestionRef.current;
						if (!state?.items.length)
							return false;
						const move = (step: number) => setSuggestion({ ...state, selected: (state.selected + step + state.items.length) % state.items.length });
						if (event.key === "ArrowDown") {
							move(1);
							return true;
						}
						if (event.key === "ArrowUp") {
							move(-1);
							return true;
						}
						if (event.key === "Enter" || event.key === "Tab") {
							const user = state.items[state.selected];
							state.command({ id: user.id, label: user.fullName });
							return true;
						}
						if (event.key === "Escape") {
							setSuggestion(null);
							return true;
						}
						return false;
					},
					onExit: () => setSuggestion(null),
				}),
			},
		}),
	], [placeholder]);

	const editor = useEditor({
		extensions,
		autofocus: autoFocus ? "end" : false,
		onUpdate: ({ editor: ed }) => setEmpty(ed.isEmpty),
		// Danh sách vẽ qua portal ra body nên không tự ẩn khi pane bị ẩn (chuyển tab) hoặc bấm ra ngoài: ẩn khi ô nhập mất focus.
		// Chọn một người dùng mousedown + preventDefault nên ô nhập không mất focus trước đó
		onBlur: () => setSuggestion(null),
		editorProps: {
			handleKeyDown: (_view, event) => {
				// Ctrl / Cmd + Enter: gửi (Enter thường xuống dòng)
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
					submitRef.current();
					return true;
				}
				return false;
			},
		},
	}, [extensions]);

	useEffect(() => {
		editor?.setEditable(!submitting);
	}, [editor, submitting]);

	const submit = async () => {
		if (!editor || editor.isEmpty || submitting)
			return;
		const content = editor.getText({ blockSeparator: "\n" }).trim();
		if (!content)
			return;
		if (content.length > COMMENT_MAX_LENGTH)
			return void message.warning(t("approval.comment.tooLong", { max: COMMENT_MAX_LENGTH }));
		// Người được nhắc = các cụm @mention còn trong nội dung (xóa cụm thì không còn nhắc)
		const mentionIds = new Set<string>();
		editor.state.doc.descendants((node) => {
			if (node.type.name === "mention" && node.attrs.id)
				mentionIds.add(node.attrs.id as string);
		});
		setSubmitting(true);
		try {
			if (await onSubmit(content, [...mentionIds])) {
				editor.commands.clearContent(true);
				setEmpty(true);
			}
		}
		finally {
			setSubmitting(false);
		}
	};
	submitRef.current = submit;

	return (
		<div className="flex flex-col gap-2">
			<EditorContent editor={editor} className="comment-input-box" />

			{suggestion?.rect && suggestion.items.length > 0 && createPortal(
				<div
					role="listbox"
					className="fixed z-[1100] max-h-60 min-w-48 overflow-y-auto rounded-lg p-1"
					style={{
						left: suggestion.rect.left,
						top: suggestion.rect.bottom + 4,
						background: token.colorBgElevated,
						boxShadow: token.boxShadowSecondary,
					}}
				>
					{suggestion.items.map((user, index) => (
						<div
							key={user.id}
							role="option"
							aria-selected={index === suggestion.selected}
							className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
							style={{ background: index === suggestion.selected ? token.colorPrimaryBg : undefined }}
							// mousedown (không phải click) để ô nhập không mất con trỏ trước khi chọn
							onMouseDown={(event) => {
								event.preventDefault();
								suggestion.command({ id: user.id, label: user.fullName });
							}}
						>
							<Avatar size={20} src={user.avatar}>{user.fullName.charAt(0)}</Avatar>
							{user.fullName}
						</div>
					))}
				</div>,
				document.body,
			)}

			<div className="flex items-center justify-end gap-2">
				{onCancel && <Button size="small" onClick={onCancel} disabled={submitting}>{t("common.cancel")}</Button>}
				<Button type="primary" size="small" loading={submitting} disabled={empty} onClick={submit}>{submitText}</Button>
			</div>
		</div>
	);
}
