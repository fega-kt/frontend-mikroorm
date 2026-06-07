import type { PieDataType } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class HomeReportService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "home-report" });
	}

	/** GET /home-report/pie */
	fetchPie(data: { by: string | number }) {
		return this.get<PieDataType[]>("pie", { searchParams: data as any });
	}

	/** POST /home-report/line */
	fetchLine(data: { range: string }) {
		return this.post<string[]>("line", { json: data });
	}
}

export const homeReportService = new HomeReportService();
