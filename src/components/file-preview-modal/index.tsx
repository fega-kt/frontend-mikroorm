import { CloseOutlined, FileExcelOutlined, FileUnknownOutlined } from "@ant-design/icons";
import { Workbook } from "@fortune-sheet/react";
import { Button, Modal, Spin, theme, Typography } from "antd";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import "@fortune-sheet/react/dist/index.css";

export interface FilePreviewModalRef {
	show: (url: string, fileName: string) => void
}

interface FilePreviewModalProps {
	ref?: React.RefObject<FilePreviewModalRef | null>
	editable?: boolean
}

const EXCEL_EXTS = new Set([".xlsx", ".xls"]);

function getFileExt(name: string) {
	return name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function argbToHex(argb: string | undefined): string | undefined {
	if (!argb || argb.length < 6)
		return undefined;
	// Skip transparent (alpha = 00)
	if (argb.length === 8 && argb.slice(0, 2).toLowerCase() === "00")
		return undefined;
	const rgb = argb.length === 8 ? argb.slice(2) : argb;
	return `#${rgb}`;
}

function xlsxColorToHex(color: any): string | undefined {
	if (!color)
		return undefined;
	return argbToHex(color.rgb);
}

function xlsxStyleToFortune(s: any): Record<string, any> {
	if (!s)
		return {};
	const style: Record<string, any> = {};

	// Background fill
	const bg = xlsxColorToHex(s.fill?.fgColor);
	if (bg)
		style.bg = bg;

	// Font
	if (s.font) {
		if (s.font.bold)
			style.bl = 1;
		if (s.font.italic)
			style.it = 1;
		if (s.font.underline)
			style.un = 1;
		if (s.font.strike)
			style.cl = 1;
		const fc = xlsxColorToHex(s.font.color);
		if (fc)
			style.fc = fc;
		if (s.font.sz)
			style.fs = s.font.sz;
		if (s.font.name)
			style.ff = s.font.name;
	}

	// Alignment
	if (s.alignment) {
		const htMap: Record<string, number> = { left: 1, center: 0, right: 2 };
		const vtMap: Record<string, number> = { top: 1, center: 0, middle: 0, bottom: 2 };
		const ht = htMap[s.alignment.horizontal];
		if (ht !== undefined)
			style.ht = ht;
		const vt = vtMap[s.alignment.vertical];
		if (vt !== undefined)
			style.vt = vt;
	}

	return style;
}

// ─── Conversion ───────────────────────────────────────────────────────────────

function xlsxToFortuneSheets(buffer: ArrayBuffer): any[] {
	const wb = XLSX.read(buffer, { type: "array", cellStyles: true });
	return wb.SheetNames.map((name, index) => {
		const ws = wb.Sheets[name];
		const refStr = ws["!ref"];
		if (!refStr)
			return { name, celldata: [], order: index, status: index === 0 ? 1 : 0 };

		const range = XLSX.utils.decode_range(refStr);
		const celldata: any[] = [];

		for (let r = range.s.r; r <= range.e.r; r++) {
			for (let c = range.s.c; c <= range.e.c; c++) {
				const addr = XLSX.utils.encode_cell({ r, c });
				const cell = ws[addr];
				if (cell != null) {
					const v: any = {
						v: cell.v,
						m: cell.w ?? (cell.v != null ? String(cell.v) : ""),
						...xlsxStyleToFortune(cell.s),
					};
					if (cell.f)
						v.f = `=${cell.f}`;
					celldata.push({ r, c, v });
				}
			}
		}

		const config: any = {};

		// Merged cells
		const merges = ws["!merges"];
		if (merges?.length) {
			const merge: Record<string, any> = {};
			for (const m of merges) {
				const key = `${m.s.r}_${m.s.c}`;
				merge[key] = { r: m.s.r, c: m.s.c, rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 };
				const originCell = celldata.find(cd => cd.r === m.s.r && cd.c === m.s.c);
				if (originCell)
					originCell.v.mc = { r: m.s.r, c: m.s.c, rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 };
				for (let mr = m.s.r; mr <= m.e.r; mr++) {
					for (let mc2 = m.s.c; mc2 <= m.e.c; mc2++) {
						if (mr === m.s.r && mc2 === m.s.c)
							continue;
						celldata.push({ r: mr, c: mc2, v: { mc: { r: m.s.r, c: m.s.c } } });
					}
				}
			}
			config.merge = merge;
		}

		// Column widths
		const cols: any[] = ws["!cols"] ?? [];
		if (cols.length) {
			const columnlen: Record<string, number> = {};
			cols.forEach((col: any, i: number) => {
				if (!col)
					return;
				const px = col.wpx ?? (col.wch ? Math.round(col.wch * 8) : undefined);
				if (px)
					columnlen[String(i)] = px;
			});
			if (Object.keys(columnlen).length)
				config.columnlen = columnlen;
		}

		// Row heights
		const rows: any[] = ws["!rows"] ?? [];
		if (rows.length) {
			const rowlen: Record<string, number> = {};
			rows.forEach((row: any, i: number) => {
				if (!row)
					return;
				const px = row.hpx ?? (row.hpt ? Math.round(row.hpt * 4 / 3) : undefined);
				if (px)
					rowlen[String(i)] = px;
			});
			if (Object.keys(rowlen).length)
				config.rowlen = rowlen;
		}

		return { name, celldata, config, order: index, status: index === 0 ? 1 : 0 };
	});
}

export function FilePreviewModal({ ref, editable = false }: FilePreviewModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [visible, setVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState("");
	const [sheets, setSheets] = useState<any[]>([]);
	const [fileType, setFileType] = useState<"excel" | "unsupported" | null>(null);

	useImperativeHandle(ref, () => ({
		show: async (url: string, name: string) => {
			setFileName(name);
			setError(null);
			setSheets([]);
			setVisible(true);
			setLoading(true);

			const ext = getFileExt(name);
			if (EXCEL_EXTS.has(ext)) {
				setFileType("excel");
				try {
					const res = await fetch(url);
					if (!res.ok)
						throw new Error(`HTTP ${res.status}`);
					const buffer = await res.arrayBuffer();
					setSheets(xlsxToFortuneSheets(buffer));
				}
				catch {
					setError(t("common.filePreview.loadError"));
				}
				finally {
					setLoading(false);
				}
			}
			else {
				setFileType("unsupported");
				setLoading(false);
			}
		},
	}));

	const handleClose = () => {
		setVisible(false);
		setSheets([]);
		setFileName("");
		setFileType(null);
		setError(null);
	};

	return (
		<Modal
			open={visible}
			closable={false}
			footer={null}
			width="100vw"
			style={{ top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
			styles={{
				wrapper: { padding: 0 },
				container: {
					height: "100vh",
					padding: 0,
					borderRadius: 0,
					display: "flex",
					flexDirection: "column",
				},
				body: {
					padding: 0,
					flex: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				},
			}}
			destroyOnHidden
		>
			<div
				className="flex flex-none items-center justify-between px-4"
				style={{
					height: 48,
					backgroundColor: token.colorBgContainer,
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
				}}
			>
				<div className="flex min-w-0 items-center gap-2">
					<FileExcelOutlined style={{ color: token.colorSuccess, flexShrink: 0 }} />
					<Typography.Text ellipsis className="text-sm font-medium">
						{fileName}
					</Typography.Text>
				</div>
				<Button type="text" icon={<CloseOutlined />} onClick={handleClose} />
			</div>

			<div className="flex-1 overflow-hidden" style={{ backgroundColor: token.colorBgLayout }}>
				{loading && (
					<div className="flex h-full items-center justify-center">
						<Spin size="large" />
					</div>
				)}

				{!loading && error && (
					<div className="flex h-full flex-col items-center justify-center gap-3">
						<FileUnknownOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
						<Typography.Text type="secondary">{error}</Typography.Text>
					</div>
				)}

				{!loading && !error && fileType === "unsupported" && (
					<div className="flex h-full flex-col items-center justify-center gap-3">
						<FileUnknownOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
						<Typography.Text type="secondary">{t("common.filePreview.unsupported")}</Typography.Text>
					</div>
				)}

				{!loading && !error && fileType === "excel" && sheets.length > 0 && (
					<Workbook
						data={sheets}
						onChange={setSheets}
						allowEdit={editable}
						showToolbar={editable}
						showFormulaBar={editable}
					/>
				)}
			</div>
		</Modal>
	);
}
