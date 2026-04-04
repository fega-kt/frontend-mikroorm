import type { Options } from "ky";
import { request } from "#src/utils/request";

export interface ServiceOptions {
	endpoint: string
}

/**
 * Lớp cơ sở cho các service thực hiện gọi API.
 * Tự động quản lý prefix endpoint và trả về dữ liệu JSON mặc định.
 */
export abstract class CrudServiceBase<T = any> {
	protected readonly endpoint: string;

	constructor(options: ServiceOptions) {
		this.endpoint = options.endpoint;
	}

	/**
	 * Helper nội bộ để tính toán URL dựa trên endpoint.
	 * @param path Đường dẫn phụ (ví dụ: "search" hoặc rỗng)
	 */
	protected getUrl(path?: string) {
		if (!path)
			return this.endpoint;
		// Nếu path đã bắt đầu bằng endpoint rồi thì không nối thêm nữa
		if (path === this.endpoint)
			return this.endpoint;
		if (path.startsWith(`${this.endpoint}/`))
			return path;
		return `${this.endpoint}/${path}`;
	}

	/** GET helper - Tự động gọi .json() */
	protected get<R = T>(path?: string, options?: Options): Promise<R> {
		return request.get(this.getUrl(path), options).json<R>();
	}

	/** POST helper - Tự động gọi .json() */
	protected post<R = T>(path?: string, options?: Options): Promise<R> {
		return request.post(this.getUrl(path), options).json<R>();
	}

	/** PUT helper - Tự động gọi .json() */
	protected put<R = T>(path?: string, options?: Options): Promise<R> {
		return request.put(this.getUrl(path), options).json<R>();
	}

	/** PATCH helper - Tự động gọi .json() */
	protected patch<R = T>(path?: string, options?: Options): Promise<R> {
		return request.patch(this.getUrl(path), options).json<R>();
	}

	/** DELETE helper - Tự động gọi .json() */
	protected delete<R = any>(path?: string, options?: Options): Promise<R> {
		return request.delete(this.getUrl(path), options).json<R>();
	}
}
