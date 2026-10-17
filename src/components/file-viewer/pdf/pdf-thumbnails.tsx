import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PageSize } from "./pdf-page";
import { theme } from "antd";
import { useEffect, useRef, useState } from "react";
import { PdfPage } from "./pdf-page";
import { useNearPages } from "./use-near-pages";

/** Chiều ngang ảnh thu nhỏ (px) */
const THUMB_WIDTH = 108;

interface PdfThumbnailsProps {
	doc: PDFDocumentProxy
	rotation: number
	currentPage: number
	sizeOf: (pageNumber: number) => PageSize
	onSelect: (pageNumber: number) => void
}

/** Cột ảnh thu nhỏ các trang: chỉ vẽ ảnh nằm trong vùng nhìn của cột, trang đang xem viền xanh */
export function PdfThumbnails({ doc, rotation, currentPage, sizeOf, onSelect }: PdfThumbnailsProps) {
	const { token } = theme.useToken();
	const [root, setRoot] = useState<HTMLDivElement | null>(null);
	const near = useNearPages(root, doc.numPages, "400px 0px");
	const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

	// Giữ ảnh của trang đang xem trong tầm nhìn khi người dùng cuộn tài liệu
	useEffect(() => {
		itemRefs.current[currentPage - 1]?.scrollIntoView({ block: "nearest" });
	}, [currentPage]);

	return (
		<div
			ref={setRoot}
			className="flex w-[196px] shrink-0 flex-col items-center gap-4 overflow-y-auto py-4"
			style={{ background: token.colorFillQuaternary, borderRight: `1px solid ${token.colorBorderSecondary}` }}
		>
			{Array.from({ length: doc.numPages }, (_, index) => {
				const pageNumber = index + 1;
				const size = sizeOf(pageNumber);
				const active = pageNumber === currentPage;
				return (
					<button
						key={pageNumber}
						ref={(el) => {
							itemRefs.current[index] = el;
						}}
						type="button"
						data-page={pageNumber}
						onClick={() => onSelect(pageNumber)}
						className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
					>
						<PdfPage
							doc={doc}
							pageNumber={pageNumber}
							scale={THUMB_WIDTH / size.width}
							rotation={rotation}
							size={size}
							active={near.has(pageNumber)}
							className="rounded-sm"
							style={{
								outline: active ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
								boxShadow: active ? `0 0 0 5px ${token.colorPrimaryBg}` : undefined,
							}}
						/>
						<span className="text-xs" style={{ color: active ? token.colorPrimary : token.colorTextSecondary, fontWeight: active ? 600 : undefined }}>
							{pageNumber}
						</span>
					</button>
				);
			})}
		</div>
	);
}
