import { useCallback, useEffect, useRef } from "react";

export interface HtmlEmailEditorApi {
	/** Chèn chữ tại con trỏ trong email */
	insertText: (text: string) => void
}

interface HtmlEmailEditorProps {
	/** HTML của email (Form.Item) */
	value?: string
	onChange?: (html: string) => void
	/** Giá trị hiển thị cho {{biến}} trong thuộc tính src (vd: logo) — khi lưu vẫn giữ biến */
	displayVars: Record<string, string>
	/** Tab đang hiện — khi hiện lại thì đo lại chiều cao */
	active: boolean
	onReady?: (api: HtmlEmailEditorApi) => void
	onFocus?: () => void
}

/** Nền xám giống khi gửi (wrapEmailDocument ở backend) */
const EDITOR_CSS = `
html, body { margin: 0; }
body { padding: 24px 12px; background: #f2f4f7; color: #3c4652; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
body:focus { outline: none; }
img { cursor: default; }
`;

const VARIABLE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;
const TEMPLATE_SRC = "data-tpl-src";

/** Bỏ phần chạy được (script, nhúng, on*, javascript:) — nội dung chỉ để soạn, không cho thực thi */
function sanitize(root: ParentNode) {
	root.querySelectorAll("script, iframe, object, embed, link, meta, base").forEach(el => el.remove());
	root.querySelectorAll("*").forEach((el) => {
		for (const attr of [...el.attributes]) {
			if (attr.name.startsWith("on") || /^\s*javascript:/i.test(attr.value))
				el.removeAttribute(attr.name);
		}
	});
}

/**
 * Soạn email trực tiếp trên chính HTML của nó (iframe designMode): bấm vào đâu sửa chữ ở đó, bố cục / style giữ
 * nguyên. Đổi cấu trúc thì dùng tab HTML.
 */
export function HtmlEmailEditor({ value, onChange, displayVars, active, onReady, onFocus }: HtmlEmailEditorProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	/** HTML vừa phát ra — value quay lại đúng bằng nó thì không nạp lại (giữ con trỏ) */
	const lastEmitted = useRef<string | undefined>(undefined);
	const callbacks = useRef({ onChange, onFocus, displayVars });
	callbacks.current = { onChange, onFocus, displayVars };

	const resize = useCallback(() => {
		const iframe = iframeRef.current;
		const doc = iframe?.contentDocument;
		if (iframe && doc?.documentElement)
			iframe.style.height = `${Math.max(doc.documentElement.scrollHeight, 320)}px`;
	}, []);

	/** HTML để lưu: trả lại {{biến}} cho src đã thay để hiển thị */
	const serialize = useCallback(() => {
		const body = iframeRef.current?.contentDocument?.body;
		if (!body)
			return "";
		const clone = body.cloneNode(true) as HTMLElement;
		clone.querySelectorAll(`[${TEMPLATE_SRC}]`).forEach((el) => {
			el.setAttribute("src", el.getAttribute(TEMPLATE_SRC) ?? "");
			el.removeAttribute(TEMPLATE_SRC);
		});
		return clone.innerHTML.trim();
	}, []);

	const load = useCallback((html: string) => {
		const doc = iframeRef.current?.contentDocument;
		if (!doc)
			return;
		const tpl = doc.createElement("template");
		tpl.innerHTML = html;
		sanitize(tpl.content);
		tpl.content.querySelectorAll("[src*='{{']").forEach((el) => {
			const src = el.getAttribute("src") ?? "";
			el.setAttribute(TEMPLATE_SRC, src);
			el.setAttribute("src", src.replace(VARIABLE_PATTERN, (_, key: string) => callbacks.current.displayVars[key] ?? ""));
		});

		doc.open();
		doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${EDITOR_CSS}</style></head><body></body></html>`);
		doc.close();
		doc.body.append(tpl.content);
		doc.designMode = "on";
		doc.execCommand("defaultParagraphSeparator", false, "p");

		// document.open() gỡ hết listener cũ → gắn lại sau mỗi lần nạp
		doc.addEventListener("input", () => {
			const next = serialize();
			lastEmitted.current = next;
			callbacks.current.onChange?.(next);
			resize();
		});
		// Dán chữ trơn để không kéo style lạ từ nơi khác vào email
		doc.addEventListener("paste", (e) => {
			e.preventDefault();
			doc.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
		});
		// Link trong email không mở khi soạn
		doc.addEventListener("click", (e) => {
			if ((e.target as HTMLElement).closest("a"))
				e.preventDefault();
		});
		doc.addEventListener("focusin", () => callbacks.current.onFocus?.());
		doc.addEventListener("mousedown", () => callbacks.current.onFocus?.());
		doc.querySelectorAll("img").forEach(img => img.addEventListener("load", resize));
		resize();
	}, [resize, serialize]);

	useEffect(() => {
		if (value === lastEmitted.current)
			return;
		lastEmitted.current = value;
		load(value ?? "");
	}, [value, load]);

	// Logo / tên app về sau nội dung → nạp lại để thay src
	useEffect(() => {
		load(lastEmitted.current ?? "");
	}, [displayVars, load]);

	useEffect(() => {
		if (active)
			requestAnimationFrame(resize);
	}, [active, resize]);

	useEffect(() => {
		onReady?.({
			insertText: (text) => {
				const iframe = iframeRef.current;
				iframe?.contentWindow?.focus();
				iframe?.contentDocument?.execCommand("insertText", false, text);
			},
		});
	}, [onReady]);

	return <iframe ref={iframeRef} title="email-editor" className="block w-full rounded-lg border-0" style={{ height: 480 }} />;
}
