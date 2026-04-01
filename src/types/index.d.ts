/**
 * Raw server response wrapper (used internally by request hook)
 */
interface ApiRawResponse<T> {
	code: number
	result: T
	message: string
	success: boolean
}

/**
 * List response result shape
 */
interface ApiListResult<T> {
	list: T[]
	total: number
	current: number
}

/**
 * 拉取表格请求参数
 */
interface ApiTableRequest extends Record<string, any> {
	cqs?: string
	pageSize?: number
	current?: number
}

type Recordable<T = any> = Record<string, T>;
