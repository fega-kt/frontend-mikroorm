/**
 * Mở link ký tạm (file private) trong tab mới.
 * Tab được mở ngay trong lúc người dùng bấm (trước khi gọi API) để trình duyệt không chặn popup,
 * rồi mới điền URL khi đã xin xong. Lỗi API đã được interceptor hiển thị nên chỉ đóng tab.
 */
export async function openSignedUrl(fetchUrl: () => Promise<{ url: string }>) {
	const tab = window.open("", "_blank");
	if (tab)
		tab.opener = null;
	try {
		const { url } = await fetchUrl();
		if (tab)
			tab.location.href = url;
		else
			window.location.assign(url);
	}
	catch {
		tab?.close();
	}
}
