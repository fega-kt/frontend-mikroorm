import type { PieDataType } from "#src/api/home-report";
import type { EChartsOption } from "echarts";
import { homeReportService } from "#src/api/home-report";
import { useQuery } from "@tanstack/react-query";
import { Card, Segmented } from "antd";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function PieChart() {
	const { t } = useTranslation();
	const [value, setValue] = useState<string | number>(() => t("home.allChannels"));

	const DATA_KEY = useMemo(() => {
		return { electronics: t("home.electronics"), home_goods: t("home.homeGoods"), apparel_accessories: t("home.apparelAccessories"), food_beverages: t("home.foodBeverages"), beauty_skincare: t("home.beautySkincare") };
	}, [t]);

	const { data = [] } = useQuery({
		queryKey: ["home-report", "pie", value],
		queryFn: () => homeReportService.fetchPie({ by: value }),
		select: (pieData: PieDataType[]) =>
			pieData.map((item) => {
				const code = item.code as keyof typeof DATA_KEY;
				return { ...item, name: DATA_KEY[code] };
			}),
	});

	const option: EChartsOption = {
		title: { text: "", subtext: "", right: "10%" },
		tooltip: { trigger: "item", formatter: "{a} <br/>{b} : {c} ({d}%)" },
		legend: { orient: "vertical", left: "left" },
		series: [
			{
				name: t("home.salesCategoryProportion"),
				type: "pie",
				radius: "55%",
				center: ["50%", "60%"],
				data,
			},
		],
	};

	return (
		<Card
			title={t("home.salesCategoryProportion")}
			extra={(
				<Segmented
					options={[t("home.allChannels"), t("home.online"), t("home.site")]}
					value={value}
					onChange={segmentedValue => setValue(segmentedValue)}
				/>
			)}
		>
			<ReactECharts opts={{ height: "auto", width: "auto" }} option={option} />
		</Card>
	);
}
