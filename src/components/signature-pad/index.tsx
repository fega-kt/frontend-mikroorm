import { ClearOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Segmented, theme, Upload } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Kích thước ảnh chữ ký lưu lại (px): đủ nét khi đóng vào khung chữ ký ~170×72 point */
const OUTPUT_WIDTH = 600;
const OUTPUT_HEIGHT = 240;
/** Ảnh tải lên lớn hơn thì từ chối (sau khi thu nhỏ vẫn giữ dưới giới hạn backend ~200KB) */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface SignaturePadProps {
	/** Ảnh chữ ký hiện có (data URL) */
	value?: string | null
	onChange?: (value: string | null) => void
}

/** Vẽ ảnh vào khung OUTPUT, giữ tỉ lệ, căn giữa, nền trong suốt → PNG data URL */
function fitToOutput(source: CanvasImageSource, width: number, height: number) {
	const canvas = document.createElement("canvas");
	canvas.width = OUTPUT_WIDTH;
	canvas.height = OUTPUT_HEIGHT;
	const ratio = Math.min(OUTPUT_WIDTH / width, OUTPUT_HEIGHT / height, 1);
	const w = width * ratio;
	const h = height * ratio;
	canvas.getContext("2d")!.drawImage(source, (OUTPUT_WIDTH - w) / 2, (OUTPUT_HEIGHT - h) / 2, w, h);
	return canvas.toDataURL("image/png");
}

/** Vùng có nét vẽ trên canvas (bỏ phần trống xung quanh) */
function inkBounds(canvas: HTMLCanvasElement) {
	const { width, height } = canvas;
	const pixels = canvas.getContext("2d")!.getImageData(0, 0, width, height).data;
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (pixels[(y * width + x) * 4 + 3] > 0) {
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}
		}
	}
	return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Ảnh chữ ký tay: vẽ bằng chuột / bút cảm ứng hoặc tải ảnh lên (PNG nền trong suốt là đẹp nhất) */
export function SignaturePad({ value, onChange }: SignaturePadProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { message } = App.useApp();
	const [mode, setMode] = useState<"draw" | "upload">("draw");
	const [drawing, setDrawing] = useState(!value);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const lastPoint = useRef<{ x: number, y: number }>(undefined);
	const dirty = useRef(false);

	// Canvas theo đúng kích thước hiển thị × devicePixelRatio để nét vẽ không bị mờ
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !drawing)
			return;
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		const context = canvas.getContext("2d")!;
		context.scale(dpr, dpr);
		context.lineCap = "round";
		context.lineJoin = "round";
		context.lineWidth = 2.2;
		context.strokeStyle = "#1a2b6d";
	}, [drawing, mode]);

	const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	};

	const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		lastPoint.current = point(event);
	};

	const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!lastPoint.current)
			return;
		const next = point(event);
		const context = event.currentTarget.getContext("2d")!;
		context.beginPath();
		context.moveTo(lastPoint.current.x, lastPoint.current.y);
		context.lineTo(next.x, next.y);
		context.stroke();
		lastPoint.current = next;
		dirty.current = true;
	};

	/** Nhấc bút: cắt sát nét vẽ rồi xuất ảnh */
	const onPointerUp = () => {
		lastPoint.current = undefined;
		const canvas = canvasRef.current;
		if (!canvas || !dirty.current)
			return;
		const bounds = inkBounds(canvas);
		if (!bounds)
			return;
		const cropped = document.createElement("canvas");
		cropped.width = bounds.width;
		cropped.height = bounds.height;
		cropped.getContext("2d")!.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
		onChange?.(fitToOutput(cropped, bounds.width, bounds.height));
	};

	const clear = () => {
		const canvas = canvasRef.current;
		canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
		dirty.current = false;
		setDrawing(true);
		onChange?.(null);
	};

	const upload = (file: File) => {
		if (!["image/png", "image/jpeg"].includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
			message.error(t("personal-center.signature.imageInvalid"));
			return false;
		}
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			onChange?.(fitToOutput(image, image.naturalWidth, image.naturalHeight));
			setDrawing(false);
			URL.revokeObjectURL(url);
		};
		image.src = url;
		return false;
	};

	const frame = { border: `1px dashed ${token.colorBorder}`, borderRadius: token.borderRadius, background: token.colorBgContainer };

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<Segmented
					size="small"
					value={mode}
					onChange={value => setMode(value as "draw" | "upload")}
					options={[
						{ value: "draw", label: t("personal-center.signature.draw") },
						{ value: "upload", label: t("personal-center.signature.upload") },
					]}
				/>
				<Button size="small" type="text" icon={<ClearOutlined />} onClick={clear}>{t("personal-center.signature.clear")}</Button>
			</div>
			{value && !drawing
				? (
					<div className="flex h-40 items-center justify-center" style={frame}>
						<img src={value} alt={t("personal-center.signature.image")} className="max-h-full max-w-full object-contain" draggable={false} />
					</div>
				)
				: mode === "draw"
					? (
						<canvas
							ref={canvasRef}
							className="h-40 w-full touch-none"
							style={{ ...frame, cursor: "crosshair" }}
							onPointerDown={onPointerDown}
							onPointerMove={onPointerMove}
							onPointerUp={onPointerUp}
							onPointerCancel={onPointerUp}
						/>
					)
					: (
						<Upload.Dragger accept="image/png,image/jpeg" showUploadList={false} beforeUpload={upload}>
							<p className="m-0 text-2xl" style={{ color: token.colorPrimary }}><UploadOutlined /></p>
							<p className="m-0 text-[13px]">{t("personal-center.signature.uploadHint")}</p>
						</Upload.Dragger>
					)}
			<span className="text-xs" style={{ color: token.colorTextTertiary }}>
				{mode === "draw" && (!value || drawing) ? t("personal-center.signature.drawHint") : t("personal-center.signature.optionalHint")}
			</span>
		</div>
	);
}
