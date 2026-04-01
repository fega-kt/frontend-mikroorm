import type { Options } from "ky";

import { healPath, loginPath } from "#src/router/extra-info";
import { usePreferencesStore } from "#src/store/preferences";
import ky from "ky";

import { AUTH_HEADER, LANG_HEADER, REFRESH_TOKEN_PATH } from "./constants";
import { handleErrorResponse } from "./error-response";
import { globalProgress } from "./global-progress";
import { goLogin } from "./go-login";
import { refreshTokenAndRetry } from "./refresh";
import { getToken } from "./token";

// 请求白名单, 请求白名单内的接口不需要携带 token
const requestWhiteList = [loginPath, healPath];

// 请求超时时间
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

const defaultConfig: Options = {
	// The input argument cannot start with a slash / when using prefixUrl option.
	prefixUrl: import.meta.env.VITE_API_BASE_URL,
	timeout: API_TIMEOUT,
	retry: {
		// 当请求失败时，最多重试次数
		limit: 3,
	},
	hooks: {
		beforeRequest: [
			async (request, options) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.start();
				}
				// 不需要携带 token 的请求
				const isWhiteRequest = requestWhiteList.some(url => request.url.endsWith(url));
				if (!isWhiteRequest) {
					const token = await getToken();
					request.headers.set(AUTH_HEADER, `Bearer ${token}`);
				}
				// 语言等所有的接口都需要携带
				request.headers.set(LANG_HEADER, usePreferencesStore.getState().language);
			},
		],
		afterResponse: [
			async (request, options, response) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.done();
				}
				// request error
				if (!response.ok) {
					if (response.status === 401) {
						// 防止刷新 refresh-token 继续接收到的 401 错误，出现死循环
						if ([`/${REFRESH_TOKEN_PATH}`].some(url => request.url.endsWith(url))) {
							goLogin();
							return response;
						}
						// If the token is expired, refresh it and try again.
						return refreshTokenAndRetry(request, options);
					}
					else {
						return handleErrorResponse(response);
					}
				}
				// request success: unwrap result field
				const data = await response.clone().json() as { result: unknown };
				return new Response(JSON.stringify(data.result), {
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
				});
			},
		],
	},
};

export const request = ky.create(defaultConfig);
