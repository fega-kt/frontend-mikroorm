import type { KyResponse, Options } from "ky";
import { userService } from "#src/api/user";

import ky from "ky";
import { AUTH_HEADER } from "./constants";
import { goLogin } from "./go-login";

let isRefreshing = false;

/**
 * 刷新token并重新发起请求
 *
 * @param request 请求对象
 * @param options 请求选项
 * @returns 响应对象
 * @throws 刷新 token 失败时抛出异常
 */
export async function refreshTokenAndRetry(request: Request, options: Options) {
	if (!isRefreshing) {
		isRefreshing = true;
		try {
			// 调用 fetchRefreshToken 函数，使用 refreshSession 获取新的 token
			const freshResponse = await userService.fetchRefreshToken();

			if (freshResponse.error || !freshResponse.data.session) {
				throw new Error(freshResponse.error?.message || "Có lỗi xảy ra");
			}
			// 从响应中提取新的 token
			const newToken = freshResponse.data.session?.access_token;

			onRefreshed(newToken);

			// 设置请求的 Authorization 头部为新的 token
			// 重试当前请求
			request.headers.set(AUTH_HEADER, `Bearer ${newToken}`);
			// 使用新的 token 重新发起请求
			return ky(request, options);
		}
		catch (error) {
			// 调用 onRefreshFailed 函数，传入错误对象
			// refreshToken 认证未通过，拒绝所有等待的请求
			onRefreshFailed(error);
			// 跳转到登录页
			goLogin();
			// 抛出错误
			throw error;
		}
		finally {
			// 无论是否发生错误，都将 isRefreshing 设置为 false
			isRefreshing = false;
		}
	}
	else {
		// 等待 token 刷新完成
		return new Promise<KyResponse>((resolve, reject) => {
			// 添加刷新订阅者
			addRefreshSubscriber({
				// 当 token 刷新成功后，将新的 token 设置到请求의 Authorization 头部，并重新发起请求
				resolve: async (newToken) => {
					request.headers.set(AUTH_HEADER, `Bearer ${newToken}`);
					resolve(ky(request, options));
				},
				// 当 token 刷新失败时，拒绝当前 Promise
				reject,
			});
		});
	}
}

// 定义一个数组，用于存储所有等待 token 刷新的订阅者
// 每个订阅者对象包含 resolve 和 reject 方法，分别用于在 token 刷新成功 hoặc thất bại
let refreshSubscribers: Array<{
	resolve: (token: string) => void // Khi token refresh thành công
	reject: (error: any) => void // Khi token refresh thất bại
}> = [];

/**
 * Khi token refresh thành công, thông báo cho tất cả người đăng ký.
 * @param token Token mới
 */
function onRefreshed(token: string) {
	refreshSubscribers.forEach(subscriber => subscriber.resolve(token));
	refreshSubscribers = [];
}

/**
 * Khi token refresh thất bại, thông báo cho tất cả người đăng ký.
 * @param error Thông tin lỗi
 */
function onRefreshFailed(error: any) {
	refreshSubscribers.forEach(subscriber => subscriber.reject(error));
	refreshSubscribers = [];
}

/**
 * Thêm một người đăng ký mới vào danh sách.
 * @param subscriber Đối tượng người đăng ký
 * @param subscriber.resolve Hàm resolve khi thành công
 * @param subscriber.reject Hàm reject khi thất bại
 */
function addRefreshSubscriber(subscriber: {
	resolve: (token: string) => void
	reject: (error: any) => void
}) {
	refreshSubscribers.push(subscriber);
}
