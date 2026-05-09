import type { Options } from "ky";
import { request } from "#src/utils/request";

export type SearchParamsBase = Record<string, string | number | boolean | undefined>;

export interface ServiceOptions {
	endpoint: string
	populate?: string[]
}

/**
 * Lớp cơ sở cho các service thực hiện gọi API.
 * Tự động quản lý prefix endpoint và trả về dữ liệu JSON mặc định.
 */
export abstract class CrudServiceBase<T = Record<string, unknown>> {
	protected readonly endpoint: string;
	protected readonly populate?: (keyof T)[];

	constructor(options: ServiceOptions) {
		this.endpoint = options.endpoint;
		this.populate = options.populate as (keyof T)[];
	}

	/**
	 * Tự động chuyển đổi các trường trong 'populate' từ Object/Array Object thành IDs (chuỗi string)
	 * để đồng bộ với mong đợi của backend (thường là ghi ID quan hệ).
	 */
	protected transformPopulatedFields(data: Partial<T>): Partial<T> {
		if (!data || !this.populate || this.populate.length === 0) {
			return data;
		}

		const clone: Record<string, unknown> = { ...data };
		this.populate.forEach((field) => {
			const key = field as string;
			if (clone[key]) {
				const val = clone[key];
				if (Array.isArray(val)) {
					clone[key] = val.map(item => (typeof item === "object" && item !== null && "id" in item ? (item as { id: string }).id : item));
				}
				else if (typeof val === "object" && val !== null && "id" in val) {
					clone[key] = (val as { id: string }).id;
				}
			}
		});
		return clone as Partial<T>;
	}

	/** Helper nội bộ để tính toán URL dựa trên endpoint. */
	protected getUrl(path?: string) {
		if (!path || path === this.endpoint) {
			return this.endpoint;
		}
		if (path.startsWith(`${this.endpoint}/`)) {
			return path;
		}
		return `${this.endpoint}/${path}`;
	}

	/** GET helper - Tự động gọi .json() */
	protected get<R = T>(path?: string, options?: Options): Promise<R> {
		return request.get(this.getUrl(path), options).json<R>();
	}

	/** POST helper - Tự động gọi .json() */
	protected post<R = T>(path?: string, options?: Options): Promise<R> {
		if (options?.json) {
			options.json = this.transformPopulatedFields(options.json as Partial<T>);
		}
		return request.post(this.getUrl(path), options).json<R>();
	}

	/** PUT helper - Tự động gọi .json() */
	protected put<R = T>(path?: string, options?: Options): Promise<R> {
		if (options?.json) {
			options.json = this.transformPopulatedFields(options.json as Partial<T>);
		}
		return request.put(this.getUrl(path), options).json<R>();
	}

	/** PATCH helper - Tự động gọi .json() */
	protected patch<R = T>(path?: string, options?: Options): Promise<R> {
		if (options?.json) {
			options.json = this.transformPopulatedFields(options.json as Partial<T>);
		}
		return request.patch(this.getUrl(path), options).json<R>();
	}

	/** DELETE helper - Tự động gọi .json() */
	protected delete<R = void>(path?: string, options?: Options): Promise<R> {
		return request.delete(this.getUrl(path), options).json<R>();
	}
}
