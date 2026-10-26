import type { ReportFilters } from "#src/api/approval-report";
import type { Dayjs } from "dayjs";
import type { ReportFilterState, ReportRangePreset } from "../use-report-filters";
import { DepartmentPicker } from "#src/components/department-picker";
import { DatePicker, Segmented, Select, theme } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const PRESETS: ReportRangePreset[] = ["7d", "30d", "quarter", "year"];

interface ReportFilterBarProps {
	filters?: ReportFilters
	value: ReportFilterState
	onChange: (patch: Partial<ReportFilterState>) => void
	/** Báo cáo tồn đọng tính tại thời điểm hiện tại: ẩn chọn khoảng thời gian */
	showRange?: boolean
	extra?: React.ReactNode
}

export function ReportFilterBar({ filters, value, onChange, showRange = true, extra }: ReportFilterBarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<div role="group" aria-label={t("approval.report.filter.label")} className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: token.colorBgContainer }}>
			{showRange && (
				<>
					<Segmented
						value={value.preset === "custom" ? undefined : value.preset}
						options={PRESETS.map(preset => ({ value: preset, label: t(`approval.report.filter.preset.${preset}`) }))}
						onChange={preset => onChange({ preset: preset as ReportRangePreset })}
					/>
					<DatePicker.RangePicker
						allowClear={false}
						format="DD/MM/YYYY"
						value={[dayjs(value.from), dayjs(value.to).subtract(1, "day")]}
						disabledDate={(day: Dayjs) => day.isAfter(dayjs(), "day")}
						onChange={(range) => {
							const [from, to] = range ?? [];
							if (from && to)
								onChange({ preset: "custom", from: from.format("YYYY-MM-DD"), to: to.add(1, "day").format("YYYY-MM-DD") });
						}}
					/>
				</>
			)}
			<DepartmentPicker
				className="min-w-56"
				allowClear
				placeholder={t("approval.report.filter.allDepartments")}
				// Picker nhận và trả về { id, name } (labelInValue)
				value={value.department as never}
				onChange={department => onChange({ department: (department as { id: string, name: string } | undefined) ?? undefined })}
			/>
			<Select
				className="min-w-56"
				allowClear
				showSearch
				optionFilterProp="label"
				placeholder={t("approval.report.filter.allRequestTypes")}
				value={value.requestTypeId}
				options={filters?.requestTypes.map(type => ({ value: type.id, label: type.name }))}
				onChange={requestTypeId => onChange({ requestTypeId })}
			/>
			<div className="flex-1" />
			{extra}
		</div>
	);
}
