import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import type { PageSize } from "./pdf-page";
import { useDeviceType } from "#src/hooks/use-device-type";
import { formatBytes } from "#src/utils/format-bytes";
import {
	LeftOutlined,
	LoadingOutlined,
	MenuOutlined,
	RightOutlined,
	RotateRightOutlined,
	SearchOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from "@ant-design/icons";
import { App, Button, Divider, Input, Select, Spin, theme, Tooltip } from "antd";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ViewFallback } from "../view-fallback";
import { PdfPage } from "./pdf-page";
import { PdfThumbnails } from "./pdf-thumbnails";
import { openRangeTransport } from "./range-transport";
import { useNearPages } from "./use-near-pages";

GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Dữ liệu phụ của pdf.js (bảng mã CJK, font chuẩn không nhúng, bộ giải mã ảnh JPX/JBIG2 dạng wasm).
 * Chỉ tải khi tài liệu cần; lấy từ CDN theo đúng phiên bản đang dùng để không phải chép vào public.
 */
const PDFJS_ASSETS = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}`;

/** Số px CSS cho mỗi point của PDF: zoom 100% = đúng khổ giấy in */
const CSS_UNITS = 96 / 72;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
/** Khoảng đệm quanh trang trong vùng cuộn (px) */
const PAD = 24;
/** Mỗi lần pdf.js xin thêm dữ liệu, tải tối thiểu chừng này byte */
const RANGE_CHUNK_BYTES = 256 * 1024;
/** Khổ A4 dọc — dùng tạm cho trang chưa tải (trước khi biết trang 1) */
const A4: PageSize = { width: 595, height: 842 };

type ZoomMode = "width" | "page" | number;

/** Thông tin để vẽ lớp phủ lên một trang (vd khung chữ ký kéo thả): px CSS = point PDF × scale */
export interface PdfPageOverlayInfo {
	pageNumber: number
	scale: number
	/** Kích thước trang theo point PDF */
	size: PageSize
}

interface PdfViewProps {
	/** URL stream có token ngắn hạn (đã hỗ trợ Range) */
	streamUrl: string
	/** Dung lượng tệp (byte) để biết đoạn đầu cần tải */
	size: number
	/** Token stream hết hạn khi xem lâu: xin URL mới */
	refreshUrl: () => Promise<string>
	onDownload: () => Promise<void> | void
	/** Lớp phủ trên từng trang (nằm trên lớp chữ). Có lớp phủ thì tắt xoay trang để tọa độ khớp với PDF */
	renderPageOverlay?: (info: PdfPageOverlayInfo) => React.ReactNode
}

/**
 * Xem PDF bằng pdf.js: chỉ tải các đoạn byte của trang đang xem (Range) và chỉ vẽ trang gần vùng nhìn,
 * nên tệp lớn cũng hiện trang đầu gần như ngay. Có ảnh thu nhỏ, zoom, xoay, nhảy trang, tìm chữ.
 */
export function PdfView({ streamUrl, size, refreshUrl, onDownload, renderPageOverlay }: PdfViewProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { message } = App.useApp();
	const { isMobile } = useDeviceType();

	const [doc, setDoc] = useState<PDFDocumentProxy>();
	const [failed, setFailed] = useState(false);
	const [progress, setProgress] = useState({ loaded: 0, total: size });
	const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
	const [firstSize, setFirstSize] = useState<PageSize>(A4);
	const [zoom, setZoom] = useState<ZoomMode>("width");
	const [rotation, setRotation] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageInput, setPageInput] = useState("1");
	const [showThumbs, setShowThumbs] = useState(true);
	const [query, setQuery] = useState("");
	const [highlight, setHighlight] = useState<string>();
	const [searching, setSearching] = useState(false);
	const [scrolling, setScrolling] = useState(false);
	const [viewport, setViewport] = useState({ width: 0, height: 0 });
	const [scroller, setScroller] = useState<HTMLDivElement | null>(null);

	const urlRef = useRef(streamUrl);
	const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
	const textCache = useRef(new Map<number, string>());
	const lastSearch = useRef<{ term: string, page: number }>(undefined);
	const scrollRatio = useRef(0);
	const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Mở tài liệu: đoạn đầu + các đoạn pdf.js xin thêm, tất cả bằng Range
	useEffect(() => {
		let cancelled = false;
		let task: PDFDocumentLoadingTask | undefined;
		(async () => {
			const { transport } = await openRangeTransport({
				getUrl: () => urlRef.current,
				refreshUrl: async () => {
					urlRef.current = await refreshUrl();
					return urlRef.current;
				},
				onProgress: (loaded, total) => !cancelled && setProgress({ loaded, total }),
				onError: () => !cancelled && setFailed(true),
			}, size);
			if (cancelled)
				return;
			task = getDocument({
				range: transport,
				rangeChunkSize: RANGE_CHUNK_BYTES,
				// Không tải ngầm phần còn lại: trang nào cần mới tải
				disableAutoFetch: true,
				disableStream: true,
				cMapUrl: `${PDFJS_ASSETS}/cmaps/`,
				cMapPacked: true,
				standardFontDataUrl: `${PDFJS_ASSETS}/standard_fonts/`,
				wasmUrl: `${PDFJS_ASSETS}/wasm/`,
			});
			const pdf = await task.promise;
			const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
			if (cancelled)
				return;
			setFirstSize({ width: first.width, height: first.height });
			setDoc(pdf);
		})().catch(() => !cancelled && setFailed(true));
		return () => {
			cancelled = true;
			void task?.destroy();
		};
		// Chỉ mở một lần cho mỗi tệp; URL mới sau khi token hết hạn đi qua urlRef
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Kích thước vùng xem để tính zoom "vừa chiều ngang" / "vừa trang"
	useEffect(() => {
		if (!scroller)
			return;
		const observer = new ResizeObserver(([entry]) => {
			setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
		});
		observer.observe(scroller);
		return () => observer.disconnect();
	}, [scroller]);

	const sizeOf = useCallback((pageNumber: number) => pageSizes[pageNumber] ?? firstSize, [pageSizes, firstSize]);
	const onPageSize = useCallback((pageNumber: number, value: PageSize) => {
		setPageSizes(prev => (prev[pageNumber]?.width === value.width && prev[pageNumber]?.height === value.height ? prev : { ...prev, [pageNumber]: value }));
	}, []);

	const scale = useMemo(() => {
		if (typeof zoom === "number")
			return zoom * CSS_UNITS;
		const base = sizeOf(currentPage);
		const swapped = rotation % 180 !== 0;
		const width = swapped ? base.height : base.width;
		const height = swapped ? base.width : base.height;
		const available = Math.max(viewport.width - PAD * 2, 100);
		const fitWidth = available / width;
		const value = zoom === "width" ? fitWidth : Math.min(fitWidth, Math.max(viewport.height - PAD * 2, 100) / height);
		return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 100) / 100));
	}, [zoom, rotation, viewport, currentPage, sizeOf]);
	const zoomPercent = Math.round((scale / CSS_UNITS) * 100);

	// Đổi zoom / xoay: giữ nguyên vị trí đang đọc theo tỉ lệ cuộn
	useLayoutEffect(() => {
		if (scroller)
			scroller.scrollTop = scrollRatio.current * scroller.scrollHeight;
	}, [scale, rotation, scroller]);

	const near = useNearPages(scroller, doc?.numPages ?? 0, "1200px 0px");

	const goToPage = useCallback((pageNumber: number) => {
		if (!doc || !scroller)
			return;
		const target = Math.min(doc.numPages, Math.max(1, pageNumber));
		const el = pageRefs.current[target - 1];
		if (el)
			scroller.scrollTo({ top: el.offsetTop - PAD });
		setCurrentPage(target);
		setPageInput(String(target));
	}, [doc, scroller]);

	const onScroll = () => {
		if (!scroller || !doc)
			return;
		scrollRatio.current = scroller.scrollTop / Math.max(scroller.scrollHeight, 1);
		// Trang hiện tại = trang cuối cùng có mép trên đã qua 1/3 vùng nhìn
		const mark = scroller.scrollTop + scroller.clientHeight / 3;
		let page = 1;
		for (let i = 0; i < pageRefs.current.length; i++) {
			const el = pageRefs.current[i];
			if (el && el.offsetTop <= mark)
				page = i + 1;
			else break;
		}
		if (page !== currentPage) {
			setCurrentPage(page);
			setPageInput(String(page));
		}
		setScrolling(true);
		clearTimeout(scrollTimer.current);
		scrollTimer.current = setTimeout(() => setScrolling(false), 1200);
	};

	const stepZoom = (direction: 1 | -1) => {
		const percent = scale / CSS_UNITS;
		const next = direction > 0 ? ZOOM_STEPS.find(step => step > percent + 0.01) : [...ZOOM_STEPS].reverse().find(step => step < percent - 0.01);
		setZoom(next ?? (direction > 0 ? ZOOM_STEPS.at(-1)! : ZOOM_STEPS[0]));
	};

	const pageText = async (pageNumber: number) => {
		const cached = textCache.current.get(pageNumber);
		if (cached !== undefined)
			return cached;
		const content = await (await doc!.getPage(pageNumber)).getTextContent();
		const text = content.items.map(item => ("str" in item ? item.str : "")).join(" ").toLocaleLowerCase();
		textCache.current.set(pageNumber, text);
		return text;
	};

	/** Tìm trang kế tiếp có từ khóa (tìm tiếp từ trang vừa thấy, hết thì quay lại đầu) */
	const search = async () => {
		const term = query.trim();
		if (!doc || !term)
			return;
		const needle = term.toLocaleLowerCase();
		const start = lastSearch.current?.term === needle ? lastSearch.current.page : currentPage - 1;
		setSearching(true);
		try {
			for (let i = 1; i <= doc.numPages; i++) {
				const page = ((start + i - 1) % doc.numPages) + 1;
				if ((await pageText(page)).includes(needle)) {
					lastSearch.current = { term: needle, page };
					setHighlight(term);
					goToPage(page);
					return;
				}
			}
			lastSearch.current = undefined;
			setHighlight(undefined);
			message.info(t("common.fileViewer.notFound", { term }));
		}
		finally {
			setSearching(false);
		}
	};

	if (failed)
		return <ViewFallback description={t("common.fileViewer.loadError")} onDownload={onDownload} />;

	const numPages = doc?.numPages ?? 0;
	const loading = progress.loaded < progress.total;
	const iconButton = (title: string, icon: React.ReactNode, onClick: () => void, extra?: { disabled?: boolean, active?: boolean }) => (
		<Tooltip title={title}>
			<Button
				type="text"
				aria-label={title}
				icon={icon}
				disabled={extra?.disabled}
				onClick={onClick}
				style={extra?.active ? { background: token.colorPrimaryBg, color: token.colorPrimary } : undefined}
			/>
		</Tooltip>
	);

	const pager = (
		<div className="flex items-center gap-1.5">
			{iconButton(t("common.fileViewer.prevPage"), <LeftOutlined />, () => goToPage(currentPage - 1), { disabled: currentPage <= 1 })}
			<Input
				size="small"
				aria-label={t("common.fileViewer.pageInput")}
				value={pageInput}
				onChange={event => setPageInput(event.target.value.replace(/\D/g, ""))}
				onPressEnter={() => goToPage(Number(pageInput) || currentPage)}
				onBlur={() => setPageInput(String(currentPage))}
				className="w-12 text-center"
			/>
			<span style={{ color: token.colorTextSecondary }}>{`/ ${numPages || "…"}`}</span>
			{iconButton(t("common.fileViewer.nextPage"), <RightOutlined />, () => goToPage(currentPage + 1), { disabled: currentPage >= numPages })}
		</div>
	);

	const fitLabel: Record<string, string> = { width: t("common.fileViewer.fitWidth"), page: t("common.fileViewer.fitPage") };
	// Vừa khung và các mức % chung một ô: đang vừa khung thì hiện tên chế độ, chọn % thì hiện số %
	const zoomSelect = (
		<Select
			size="small"
			className="w-[136px]"
			value={typeof zoom === "number" ? String(zoomPercent) : zoom}
			labelRender={({ value }) => fitLabel[String(value)] ?? `${value}%`}
			onChange={value => setZoom(value === "width" || value === "page" ? value : Number(value) / 100)}
			options={[
				{ value: "width", label: fitLabel.width },
				{ value: "page", label: fitLabel.page },
				...ZOOM_STEPS.map(step => ({ value: String(step * 100), label: `${step * 100}%` })),
			]}
			popupMatchSelectWidth={false}
		/>
	);

	const zoomControls = (
		<div className="flex items-center gap-1.5">
			{iconButton(t("common.fileViewer.zoomOut"), <ZoomOutOutlined />, () => stepZoom(-1), { disabled: scale <= MIN_SCALE })}
			{zoomSelect}
			{iconButton(t("common.fileViewer.zoomIn"), <ZoomInOutlined />, () => stepZoom(1), { disabled: scale >= MAX_SCALE })}
		</div>
	);

	const pages = doc && (
		<div className="flex flex-col items-center gap-4" style={{ padding: PAD, minWidth: "fit-content" }}>
			{Array.from({ length: numPages }, (_, index) => {
				const pageNumber = index + 1;
				return (
					<div
						key={pageNumber}
						data-page={pageNumber}
						ref={(el) => {
							pageRefs.current[index] = el;
						}}
						className="relative"
						style={{ boxShadow: token.boxShadowTertiary }}
					>
						<PdfPage
							doc={doc}
							pageNumber={pageNumber}
							scale={scale}
							rotation={rotation}
							size={sizeOf(pageNumber)}
							active={near.has(pageNumber)}
							withText
							highlight={highlight}
							onSize={onPageSize}
						/>
						{renderPageOverlay && (
							<div className="absolute inset-0 z-10">
								{renderPageOverlay({ pageNumber, scale, size: sizeOf(pageNumber) })}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);

	return (
		<div className="flex h-full flex-col">
			{!isMobile && (
				<div
					className="grid shrink-0 items-center gap-3 px-4 py-2"
					style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", background: token.colorFillQuaternary, borderBottom: `1px solid ${token.colorBorderSecondary}` }}
				>
					<div className="flex items-center gap-2">
						{iconButton(t("common.fileViewer.toggleThumbnails"), <MenuOutlined />, () => setShowThumbs(value => !value), { active: showThumbs })}
						<Divider orientation="vertical" className="m-0" />
						{pager}
					</div>
					{zoomControls}
					<div className="flex items-center justify-end gap-2">
						{!renderPageOverlay && iconButton(t("common.fileViewer.rotate"), <RotateRightOutlined />, () => setRotation(value => (value + 90) % 360))}
						<Input
							className="max-w-60"
							allowClear
							placeholder={t("common.fileViewer.search")}
							aria-label={t("common.fileViewer.search")}
							prefix={searching ? <LoadingOutlined /> : <SearchOutlined style={{ color: token.colorTextTertiary }} />}
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								if (!event.target.value)
									setHighlight(undefined);
							}}
							onPressEnter={search}
						/>
					</div>
				</div>
			)}

			{/* Tiến độ tải: chỉ phần đã tải theo Range, không phải cả tệp */}
			<div className="h-0.5 shrink-0" style={{ background: loading ? token.colorFillSecondary : "transparent" }}>
				{loading && <div className="h-full transition-[width]" style={{ width: `${(progress.loaded / Math.max(progress.total, 1)) * 100}%`, background: token.colorPrimary }} />}
			</div>

			<div className="flex min-h-0 flex-1">
				{doc && showThumbs && !isMobile && (
					<PdfThumbnails doc={doc} rotation={rotation} currentPage={currentPage} sizeOf={sizeOf} onSelect={goToPage} />
				)}
				<div className="relative min-w-0 flex-1">
					<div ref={setScroller} onScroll={onScroll} className="absolute inset-0 overflow-auto" style={{ background: token.colorBgLayout }}>
						{pages ?? <div className="flex h-full items-center justify-center"><Spin /></div>}
					</div>
					{doc && (
						<div
							className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[13px] text-white transition-opacity duration-300"
							style={{ background: "rgb(31 31 31 / 0.82)", opacity: scrolling || isMobile ? 1 : 0 }}
						>
							<span>{t("common.fileViewer.pageIndicator", { page: currentPage, total: numPages })}</span>
							{loading && (
								<>
									<span className="h-3 w-px bg-white/30" />
									<span className="text-white/75">{t("common.fileViewer.loaded", { loaded: formatBytes(progress.loaded), total: formatBytes(progress.total) })}</span>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{isMobile && (
				<div className="flex shrink-0 items-center justify-between px-2 py-2" style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}>
					{zoomSelect}
					{pager}
					{!renderPageOverlay && iconButton(t("common.fileViewer.rotate"), <RotateRightOutlined />, () => setRotation(value => (value + 90) % 360))}
				</div>
			)}
		</div>
	);
}
