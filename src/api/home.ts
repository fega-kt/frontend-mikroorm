import { request } from "#src/utils/request";

export interface PieDataType {
	value: number
	code: string
}

export function fetchPie(data: { by: string | number }) {
	return request.get<PieDataType[]>("home/pie", { searchParams: data }).json();
}

export function fetchLine(data: { range: string }) {
	return request.post<string[]>("home/line", { json: data }).json();
}
