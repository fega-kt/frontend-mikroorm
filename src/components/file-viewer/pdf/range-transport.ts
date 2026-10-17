import { PDFDataRangeTransport } from "pdfjs-dist";

/** Đoạn đầu tải trước khi mở tài liệu: đủ cho phần đầu file (header, trang 1 của PDF linearized) */
const INITIAL_CHUNK_BYTES = 256 * 1024;

export interface RangeSource {
	/** URL stream hiện tại (token ngắn hạn) */
	getUrl: () => string
	/** Token hết hạn (401): xin URL mới rồi tải lại đoạn đó */
	refreshUrl: () => Promise<string>
	/** Số byte đã tải về (để hiện tiến độ) */
	onProgress: (loaded: number, total: number) => void
	/** Tải một đoạn thất bại hẳn: pdf.js không tự báo lỗi nên phải đánh dấu ở ngoài */
	onError: (error: unknown) => void
}

/** Tổng dung lượng từ header "Content-Range: bytes 0-262143/22070000" */
function totalFromContentRange(header: string | null) {
	const total = Number(header?.split("/")[1]);
	return Number.isFinite(total) && total > 0 ? total : undefined;
}

/**
 * Nguồn dữ liệu cho pdf.js chỉ đi bằng request Range: trình duyệt không bao giờ tải nguyên file,
 * pdf.js xin đoạn nào (trang đang xem, bảng xref…) thì tải đoạn đó.
 * Không dùng `getDocument({ url })` vì cách đó luôn mở một request tải cả file trước rồi mới chuyển sang Range.
 */
export async function openRangeTransport(source: RangeSource, sizeHint: number) {
	let loaded = 0;

	async function fetchRange(begin: number, end: number, retried = false): Promise<{ chunk: Uint8Array, total?: number }> {
		const response = await fetch(source.getUrl(), { headers: { Range: `bytes=${begin}-${end - 1}` } });
		if (response.status === 401 && !retried) {
			await source.refreshUrl();
			return fetchRange(begin, end, true);
		}
		if (!response.ok)
			throw new Error(`Range request failed: ${response.status}`);
		const chunk = new Uint8Array(await response.arrayBuffer());
		// Server không hỗ trợ Range (200): đã nhận cả file
		const total = response.status === 206 ? totalFromContentRange(response.headers.get("Content-Range")) : chunk.length;
		return { chunk, total };
	}

	const first = await fetchRange(0, Math.min(INITIAL_CHUNK_BYTES, sizeHint || INITIAL_CHUNK_BYTES));
	const total = first.total ?? sizeHint;
	loaded = first.chunk.length;
	source.onProgress(loaded, total);

	class RangeTransport extends PDFDataRangeTransport {
		override requestDataRange(begin: number, end: number) {
			fetchRange(begin, end)
				.then(({ chunk }) => {
					loaded = Math.min(total, loaded + chunk.length);
					source.onProgress(loaded, total);
					this.onDataRange(begin, chunk);
				})
				.catch(source.onError);
		}
	}

	return { transport: new RangeTransport(total, first.chunk), total };
}
