import { useMemo } from "react";
import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH } from "./signature-size";

/**
 * Khung chữ ký đúng như bản ký (service ký số vẽ khung trong PDF theo cùng mẫu, cùng hằng số và cùng cách xếp chữ — đổi một
 * bên thì đổi cả bên kia: e-signature SignatureAppearance.cs). Đơn vị là điểm PDF của khung chuẩn (SIGNATURE_WIDTH ×
 * SIGNATURE_HEIGHT); khung to / nhỏ hơn thì phóng cả khung cùng hệ số.
 */
const HEADER = "ĐÃ KÝ SỐ";
const BORDER_WIDTH = 0.75;
const BORDER_RADIUS = 2;
const IMAGE_SHARE = 0.4;
const IMAGE_PADDING_X = 3;
const IMAGE_PADDING_Y = 4;
const DIVIDER_WIDTH = 0.5;
const DIVIDER_INSET = 8;
const TEXT_PADDING_X = 5;
const TEXT_PADDING_Y = 4;
const HEADER_SIZE = 5.5;
const SIGNER_SIZE = 8.5;
const BODY_SIZE = 6.5;
const MIN_SCALE = 0.5;
const SCALE_STEP = 0.05;
const HEADER_CHAR_SPACING = 0.06;
const LINE_HEIGHT = 1.25;
const HEADER_GAP = 1;

const COLORS = {
	border: "#1f3a8a",
	divider: "#c7d2e8",
	header: "#15803d",
	label: "#52525b",
	signer: "#111111",
	value: "#27272a",
};
const FONT_FAMILY = "\"Noto Sans\", sans-serif";

interface Run { text: string, bold: boolean, size: number, color: string }
interface Piece extends Run { gap: boolean }
interface Row { pieces: Piece[], size: number }

/** Tách "Nhãn: giá trị"; dòng đầu (người ký) giá trị in đậm và to hơn */
function toRuns(line: string, index: number, scale: number): Run[] {
	const body = BODY_SIZE * scale;
	const split = line.indexOf(": ");
	const label = split < 0 ? "" : line.slice(0, split + 2);
	const value = split < 0 ? line : line.slice(split + 2);
	const runs: Run[] = [];
	if (label)
		runs.push({ text: label, bold: false, size: body, color: COLORS.label });
	runs.push(index === 0
		? { text: value, bold: true, size: SIGNER_SIZE * scale, color: COLORS.signer }
		: { text: value, bold: false, size: body, color: COLORS.value });
	return runs;
}

/** Xếp chữ thành các hàng theo độ rộng: xuống dòng theo từ, từ dài hơn cả hàng thì cắt theo ký tự */
function layout(context: CanvasRenderingContext2D, lines: string[], scale: number, maxWidth: number) {
	const measure = (text: string, run: Run) => {
		context.font = `${run.bold ? 700 : 400} ${run.size}px ${FONT_FAMILY}`;
		return context.measureText(text).width;
	};
	const rows: Row[] = [];
	lines.forEach((line, index) => {
		let pieces: Piece[] = [];
		let x = 0;
		let rowSize = 0;
		const newRow = () => {
			rows.push({ pieces, size: rowSize });
			pieces = [];
			x = 0;
			rowSize = 0;
		};
		for (const run of toRuns(line, index, scale)) {
			const space = measure(" ", run);
			for (const word of run.text.split(" ").filter(Boolean)) {
				let gap = x === 0 ? 0 : space;
				const wordWidth = measure(word, run);
				if (x > 0 && x + gap + wordWidth > maxWidth) {
					newRow();
					gap = 0;
				}
				if (wordWidth <= maxWidth - x - gap) {
					pieces.push({ ...run, text: word, gap: gap > 0 });
					x += gap + wordWidth;
					rowSize = Math.max(rowSize, run.size);
					continue;
				}
				let rest = word;
				while (rest.length > 0) {
					let take = 1;
					while (take < rest.length && measure(rest.slice(0, take + 1), run) <= maxWidth - x)
						take++;
					const part = rest.slice(0, take);
					pieces.push({ ...run, text: part, gap: false });
					x += measure(part, run);
					rowSize = Math.max(rowSize, run.size);
					rest = rest.slice(take);
					if (rest.length > 0)
						newRow();
				}
			}
		}
		if (pieces.length > 0)
			newRow();
	});
	return rows;
}

/** Cỡ chữ lớn nhất (co cùng tỉ lệ) để cả khối chữ vừa khung */
function fitText(lines: string[], maxWidth: number, maxHeight: number) {
	const context = document.createElement("canvas").getContext("2d");
	// Không đo được chữ: mỗi dòng một hàng, không co
	if (!context) {
		const rows = lines.map((line, index) => {
			const runs = toRuns(line, index, 1);
			return { pieces: runs.map(run => ({ ...run, gap: false })), size: Math.max(...runs.map(run => run.size)) };
		});
		return { rows, scale: 1 };
	}
	let scale = 1;
	while (true) {
		const rows = layout(context, lines, scale, maxWidth);
		const height = HEADER_SIZE * scale * LINE_HEIGHT + HEADER_GAP * scale + rows.reduce((sum, row) => sum + row.size * LINE_HEIGHT, 0);
		if (height <= maxHeight || scale - SCALE_STEP < MIN_SCALE)
			return { rows, scale };
		scale -= SCALE_STEP;
	}
}

interface SignatureAppearanceProps {
	/** Kích thước khung theo điểm PDF */
	width: number
	height: number
	/** px CSS trên một điểm PDF */
	scale: number
	lines: string[]
	signatureImage: string | null
}

export function SignatureAppearance({ width: boxWidth, height: boxHeight, scale: viewScale, lines, signatureImage }: SignatureAppearanceProps) {
	// Vẽ theo khung chuẩn rồi phóng cùng hệ số (như ma trận biến đổi bên service ký số)
	const unit = Math.min(boxWidth / SIGNATURE_WIDTH, boxHeight / SIGNATURE_HEIGHT);
	const width = boxWidth / unit;
	const height = boxHeight / unit;
	const scale = viewScale * unit;
	const px = (pt: number) => pt * scale;
	const cellWidth = signatureImage ? width * IMAGE_SHARE : 0;
	const textLeft = cellWidth + TEXT_PADDING_X;
	const { rows, scale: textScale } = useMemo(
		() => fitText(lines, width - TEXT_PADDING_X - textLeft, height - TEXT_PADDING_Y * 2),
		[lines, width, height, textLeft],
	);
	const headerSize = HEADER_SIZE * textScale;

	return (
		<div
			className="relative select-none overflow-hidden bg-white"
			style={{
				width: px(width),
				height: px(height),
				borderRadius: px(BORDER_RADIUS),
				boxShadow: `inset 0 0 0 ${px(BORDER_WIDTH)}px ${COLORS.border}`,
				fontFamily: FONT_FAMILY,
			}}
		>
			{signatureImage && (
				<>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: 0, top: 0, width: px(cellWidth), height: px(height), padding: `${px(IMAGE_PADDING_Y)}px ${px(IMAGE_PADDING_X)}px` }}
					>
						<img src={signatureImage} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
					</div>
					<div
						className="absolute"
						style={{ left: px(cellWidth - DIVIDER_WIDTH / 2), top: px(DIVIDER_INSET), width: px(DIVIDER_WIDTH), height: px(height - DIVIDER_INSET * 2), background: COLORS.divider }}
					/>
				</>
			)}
			<div
				className="absolute flex flex-col justify-center whitespace-nowrap"
				style={{ left: px(textLeft), top: px(TEXT_PADDING_Y), right: px(TEXT_PADDING_X), bottom: px(TEXT_PADDING_Y), lineHeight: LINE_HEIGHT }}
			>
				<div
					className="flex items-center font-bold"
					style={{ fontSize: px(headerSize), color: COLORS.header, letterSpacing: px(HEADER_CHAR_SPACING * headerSize), marginBottom: px(HEADER_GAP * textScale), gap: px(headerSize * 0.35) }}
				>
					<svg viewBox="0 0 24 24" width={px(headerSize)} height={px(headerSize)} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
						<circle cx="12" cy="12" r="10.5" />
						<path d="M6.6 12.2 L10.6 16 L17.8 8" />
					</svg>
					<span>{HEADER}</span>
				</div>
				{rows.map((row, index) => (
					// Hàng đã được xếp sẵn (cùng cách với bản ký), không để trình duyệt tự xuống dòng
					// eslint-disable-next-line react/no-array-index-key
					<div key={index} style={{ fontSize: px(row.size) }}>
						{row.pieces.map((piece, i) => (
							// eslint-disable-next-line react/no-array-index-key
							<span key={i} style={{ fontSize: px(piece.size), fontWeight: piece.bold ? 700 : 400, color: piece.color }}>
								{piece.gap ? ` ${piece.text}` : piece.text}
							</span>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
