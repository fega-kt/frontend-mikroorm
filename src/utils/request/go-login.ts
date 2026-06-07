import { rememberRoute } from "#src/utils/remember-route";

export async function goLogin() {
	const { useAuthStore } = await import("#src/store/auth");
	useAuthStore.getState().reset();
	window.location.href = `${import.meta.env.BASE_URL}login${rememberRoute()}`;
}
