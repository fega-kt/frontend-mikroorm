import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { CSSProperties } from "react";
import { RenderingCancelledException, TextLayer } from "pdfjs-dist";
import { useEffect, useRef } from "react";
import "./text-layer.css";

export interface PageSize {
	width: number
	height: number
}

interface PdfPageProps {
	doc: PDFDocumentProxy
	pageNumber: number
	scale: number
	/** Góc xoay người xem chọn (0/90/180/270), cộng thêm vào góc xoay sẵn của trang */
	rotation: number
	/** Kích thước trang ở zoom 100%, chưa xoay — trang chưa tải thì lấy theo trang đã biết */
	size: PageSize
	/** Chỉ vẽ khi trang ở gần vùng nhìn; rời xa thì giải phóng canvas */
	active: boolean
	/** Có lớp chữ để bôi đen / tìm chữ (ảnh thu nhỏ thì không cần) */
	withText?: boolean
	/** Từ khóa tìm kiếm: tô các đoạn chữ chứa nó */
	highlight?: string
	/** Báo kích thước thật của trang khi tải xong (trang trong một file có thể khác khổ) */
	onSize?: (pageNumber: number, size: PageSize) => void
	className?: string
	style?: CSSProperties
}

/** Kích thước hiển thị sau khi xoay */
function displaySize(size: PageSize, scale: number, rotation: number): PageSize {
	const swapped = rotation % 180 !== 0;
	return {
		width: Math.floor((swapped ? size.height : size.width) * scale),
		height: Math.floor((swapped ? size.width : size.height) * scale),
	};
}

function markMatches(container: HTMLElement | null, term: string | undefined) {
	if (!container)
		return;
	const needle = term?.trim().toLocaleLowerCase();
	container.querySelectorAll<HTMLElement>("span").forEach((span) => {
		span.classList.toggle("pdf-match", !!needle && (span.textContent ?? "").toLocaleLowerCase().includes(needle));
	});
}

/** Một trang PDF: canvas + lớp chữ, chỉ vẽ khi `active` (đang ở gần vùng nhìn) */
export function PdfPage({ doc, pageNumber, scale, rotation, size, active, withText, highlight, onSize, className, style }: PdfPageProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const textRef = useRef<HTMLDivElement>(null);
	const highlightRef = useRef(highlight);
	highlightRef.current = highlight;
	const onSizeRef = useRef(onSize);
	onSizeRef.current = onSize;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas)
			return;
		if (!active) {
			// Giải phóng bộ nhớ của trang đã cuộn qua xa
			canvas.width = 0;
			canvas.height = 0;
			textRef.current?.replaceChildren();
			return;
		}
		let cancelled = false;
		let task: RenderTask | undefined;
		let text: TextLayer | undefined;
		(async () => {
			const page = await doc.getPage(pageNumber);
			if (cancelled)
				return;
			const natural = page.getViewport({ scale: 1 });
			onSizeRef.current?.(pageNumber, { width: natural.width, height: natural.height });
			const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
			// Vẽ theo mật độ điểm ảnh của màn hình để chữ nét khi zoom / trên màn retina
			const ratio = window.devicePixelRatio || 1;
			canvas.width = Math.floor(viewport.width * ratio);
			canvas.height = Math.floor(viewport.height * ratio);
			task = page.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
			await task.promise;
			const layer = textRef.current;
			if (cancelled || !withText || !layer)
				return;
			layer.replaceChildren();
			layer.style.setProperty("--total-scale-factor", String(viewport.scale));
			text = new TextLayer({ textContentSource: page.streamTextContent(), container: layer, viewport });
			await text.render();
			markMatches(layer, highlightRef.current);
		})().catch((error) => {
			if (!(error instanceof RenderingCancelledException))
				console.warn(`Render PDF page ${pageNumber} failed`, error);
		});
		return () => {
			cancelled = true;
			task?.cancel();
			text?.cancel();
		};
	}, [doc, pageNumber, scale, rotation, active, withText]);

	useEffect(() => {
		markMatches(textRef.current, highlight);
	}, [highlight]);

	const box = displaySize(size, scale, rotation);
	return (
		<div className={`relative shrink-0 overflow-hidden bg-white ${className ?? ""}`} style={{ ...style, width: box.width, height: box.height }}>
			<canvas ref={canvasRef} className="block" style={{ width: "100%", height: "100%" }} />
			{withText && <div ref={textRef} className="pdf-text-layer" />}
		</div>
	);
}
