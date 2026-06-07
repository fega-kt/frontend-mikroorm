import type { EChartsOption } from "echarts";
import { homeReportService } from "#src/api/home-report";
import { useQuery } from "@tanstack/react-query";
import { Card, Radio } from "antd";
import ReactECharts from "echarts-for-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LineChart() {
	const { t } = useTranslation();
	const [value, setValue] = useState("week");

	const { data = [] } = useQuery({
		queryKey: ["home-report", "line", value],
		queryFn: () => homeReportService.fetchLine({ range: value }),
	});

	const DATA_KEYS = {
		week: [
			t("home.monday"),
			t("home.thursday"),
			t("home.wednesday"),
			t("home.thursday"),
			t("home.friday"),
			t("home.saturday"),
			t("home.sunday"),
		],
	};

	const option: EChartsOption = {
		dataZoom: { type: value === "week" ? "inside" : "slider" },
		title: { text: "", subtext: "" },
		xAxis: {
			type: "category",
			// @ts-expect-error: xxx
			data: DATA_KEYS[value],
		},
		yAxis: { type: "value" },
		tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
		series: [{ type: "line", data }],
	};

	return (
		<Card
			title={t("home.sales")}
			extra={(
				<Radio.Group
					defaultValue="week"
					buttonStyle="solid"
					value={value}
					onChange={e => setValue(e.target.value)}
				>
					<Radio.Button value="week">{t("home.thisWeek")}</Radio.Button>
					<Radio.Button value="month">{t("home.thisMonth")}</Radio.Button>
					<Radio.Button value="year">{t("home.thisYear")}</Radio.Button>
				</Radio.Group>
			)}
		>
			<ReactECharts opts={{ height: "auto", width: "auto" }} option={option} />
		</Card>
	);
}
