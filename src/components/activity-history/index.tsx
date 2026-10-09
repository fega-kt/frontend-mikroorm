import type { ActivityLogEntity } from "#src/api/activity-log/types";
import { ActivityLogAction } from "#src/api/activity-log/types";
import { RichTextEditor } from "#src/components/rich-text-editor";
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	HistoryOutlined,
	PlusCircleOutlined,
	RedoOutlined,
	RobotOutlined,
	SwapOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Empty, Skeleton, Space, Tag, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Title } = Typography;

const ACTION_COLORS: Record<ActivityLogAction, string> = {
	[ActivityLogAction.CREATE]: "green",
	[ActivityLogAction.UPDATE]: "blue",
	[ActivityLogAction.DELETE]: "red",
	[ActivityLogAction.RESTORE]: "cyan",
	[ActivityLogAction.STATUS_CHANGE]: "purple",
	[ActivityLogAction.ASSIGN]: "orange",
	[ActivityLogAction.APPROVE]: "green",
	[ActivityLogAction.REJECT]: "red",
};

const ACTION_ICONS: Record<ActivityLogAction, React.ReactNode> = {
	[ActivityLogAction.CREATE]: <PlusCircleOutlined />,
	[ActivityLogAction.UPDATE]: <EditOutlined />,
	[ActivityLogAction.DELETE]: <DeleteOutlined />,
	[ActivityLogAction.RESTORE]: <RedoOutlined />,
	[ActivityLogAction.STATUS_CHANGE]: <SwapOutlined />,
	[ActivityLogAction.ASSIGN]: <TeamOutlined />,
	[ActivityLogAction.APPROVE]: <CheckCircleOutlined />,
	[ActivityLogAction.REJECT]: <CloseCircleOutlined />,
};

// Fields stored as HTML (rich text)
const HTML_FIELDS = new Set(["description", "note", "content"]);

function isHtml(field: string, value: any): boolean {
	return HTML_FIELDS.has(field) && typeof value === "string" && value.includes("<");
}

function isEmptyValue(value: any): boolean {
	return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** Phần riêng của từng màn; giá trị nào không truyền thì dùng mặc định. */
interface DisplayOptions {
	/** field → i18n key của nhãn; field không có trong map thì hiện tên field */
	fieldLabels?: Record<string, string>
	/** Định dạng giá trị của field; trả undefined thì dùng định dạng mặc định */
	formatValue?: (field: string, value: any) => string | undefined
	/** Màu của giá trị MỚI; undefined (hoặc "success") thì dùng màu xanh mặc định, "error" dùng màu đỏ (vd: giá trị "Tắt") */
	valueTone?: (field: string, value: any) => "success" | "error" | undefined
	/** action → i18n key của nhãn, ghi đè nhãn mặc định `common.history.action.*` */
	actionLabels?: Partial<Record<ActivityLogAction, string>>
}

function useFormatText({ formatValue }: DisplayOptions) {
	const { t } = useTranslation();
	return (field: string, value: any): string => {
		if (isEmptyValue(value))
			return t("common.history.emptyValue");
		const custom = formatValue?.(field, value);
		if (custom !== undefined)
			return custom;
		if (Array.isArray(value))
			return value.map(v => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
		if (typeof value === "object")
			return JSON.stringify(value);
		return String(value);
	};
}

/** Class của ô giá trị mới theo tone; mặc định là màu xanh */
function newValueClass(options: DisplayOptions, field: string, value: any): string {
	return options.valueTone?.(field, value) === "error"
		? "border border-solid border-errorBorder bg-errorBg text-errorText"
		: "border border-solid border-successBorder bg-successBg text-successText";
}

// ─── Field row wrapper ────────────────────────────────────────────────────────

function FieldRow({ field, options, children }: { field: string, options: DisplayOptions, children: React.ReactNode }) {
	const { t } = useTranslation();
	const labelKey = options.fieldLabels?.[field];

	return (
		<div className="rounded-md border border-solid border-colorBorderSecondary bg-colorFillTertiary px-3 py-2 text-xs">
			<span className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-colorTextSecondary">
				{labelKey ? t(labelKey) : field}
			</span>
			{children}
		</div>
	);
}

// ─── Diff block (UPDATE / STATUS_CHANGE) ─────────────────────────────────────

function DiffBlock({ oldData, newData, options }: { oldData?: Record<string, any>, newData?: Record<string, any>, options: DisplayOptions }) {
	const { t } = useTranslation();
	const formatText = useFormatText(options);
	// Chỉ hiện field có giá trị hiển thị khác nhau (log có thể lưu cả field không đổi, hoặc "" so với null)
	const fields = Array.from(new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]))
		.filter(field => formatText(field, oldData?.[field]) !== formatText(field, newData?.[field]));

	if (fields.length === 0)
		return <div className="mt-1 text-xs italic text-colorTextSecondary">{t("common.history.noChanges")}</div>;

	return (
		<div className="mt-2 flex flex-col gap-1.5">
			{fields.map((field) => {
				const oldVal = oldData?.[field];
				const newVal = newData?.[field];

				if (isHtml(field, oldVal) || isHtml(field, newVal)) {
					return (
						<FieldRow key={field} field={field} options={options}>
							<div className="flex flex-col gap-2">
								<div>
									<span className="text-[10px] text-colorTextSecondary mb-1 block">{t("common.history.before")}</span>
									<div className="rounded border border-solid border-colorBorderSecondary bg-colorBgContainer line-through">
										<RichTextEditor value={oldVal ?? ""} readOnly />
									</div>
								</div>
								<div>
									<span className="text-[10px] text-colorTextSecondary mb-1 block">{t("common.history.after")}</span>
									<div className="rounded border border-solid border-successBorder bg-successBg">
										<RichTextEditor value={newVal ?? ""} readOnly />
									</div>
								</div>
							</div>
						</FieldRow>
					);
				}

				return (
					<FieldRow key={field} field={field} options={options}>
						<div className="flex items-center gap-2 flex-wrap">
							<span className="rounded bg-colorFillSecondary px-2 py-0.5 font-medium text-colorTextSecondary line-through break-all">
								{formatText(field, oldVal)}
							</span>
							<span className="text-colorTextSecondary">→</span>
							<span className={`rounded px-2 py-0.5 font-medium break-all ${newValueClass(options, field, newVal)}`}>
								{formatText(field, newVal)}
							</span>
						</div>
					</FieldRow>
				);
			})}
		</div>
	);
}

// ─── Single data block (CREATE / DELETE / RESTORE) ────────────────────────────

function DataBlock({ data, variant, options }: { data?: Record<string, any>, variant: "new" | "old", options: DisplayOptions }) {
	const formatText = useFormatText(options);
	// Bỏ field rỗng cho gọn
	const entries = Object.entries(data ?? {}).filter(([, value]) => !isEmptyValue(value));
	if (entries.length === 0)
		return null;
	const isNew = variant === "new";

	return (
		<div className="mt-2 flex flex-col gap-1.5">
			{entries.map(([field, value]) => {
				if (isHtml(field, value)) {
					return (
						<FieldRow key={field} field={field} options={options}>
							<div className={`rounded border border-solid ${isNew ? "border-successBorder bg-successBg" : "border-colorBorderSecondary bg-colorBgContainer line-through"}`}>
								<RichTextEditor value={value ?? ""} readOnly />
							</div>
						</FieldRow>
					);
				}

				return (
					<FieldRow key={field} field={field} options={options}>
						<span className={`rounded px-2 py-0.5 font-medium break-all ${isNew ? newValueClass(options, field, value) : "bg-colorFillSecondary text-colorTextSecondary line-through"}`}>
							{formatText(field, value)}
						</span>
					</FieldRow>
				);
			})}
		</div>
	);
}

// ─── Activity item ────────────────────────────────────────────────────────────

function ActivityItem({ log, options }: { log: ActivityLogEntity, options: DisplayOptions }) {
	const { t } = useTranslation();
	const user = (log as any).createdBy;
	const color = ACTION_COLORS[log.action] ?? "default";
	const actionLabel = t(options.actionLabels?.[log.action] ?? `common.history.action.${log.action}`, { defaultValue: log.action });

	const renderBody = () => {
		switch (log.action) {
			case ActivityLogAction.CREATE:
			case ActivityLogAction.RESTORE:
				return <DataBlock data={log.newData} variant="new" options={options} />;
			case ActivityLogAction.DELETE:
				return <DataBlock data={log.oldData} variant="old" options={options} />;
			case ActivityLogAction.UPDATE:
			case ActivityLogAction.STATUS_CHANGE:
				return <DiffBlock oldData={log.oldData} newData={log.newData} options={options} />;
			case ActivityLogAction.ASSIGN:
				return (
					<div className="mt-1 text-xs text-colorTextSecondary">
						{log.newData?.assignee
							? t("common.history.assignedTo", { name: log.newData.assignee })
							: t("common.history.assignedUpdated")}
					</div>
				);
			case ActivityLogAction.APPROVE:
			case ActivityLogAction.REJECT:
				return log.newData?.rejectReason
					? (
						<div className="mt-1 text-xs text-colorTextSecondary">
							{t("common.history.rejectReason", { reason: log.newData.rejectReason })}
						</div>
					)
					: null;
			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col gap-0.5">
			<div className="flex items-center gap-2 flex-wrap">
				{user
					? (
						<Space size={6}>
							<Avatar src={user.avatar} icon={<UserOutlined />} size={20} className="shrink-0" />
							<Text strong className="text-sm">{user.fullName ?? user.loginName ?? t("common.history.user")}</Text>
						</Space>
					)
					: (
						<Space size={6}>
							<Avatar icon={<RobotOutlined />} size={20} className="shrink-0" />
							<Text strong className="text-sm">{t("common.history.system")}</Text>
						</Space>
					)}
				<Tag color={color} className="text-xs">{actionLabel}</Tag>
				<Text type="secondary" className="text-xs">
					{dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
					{" · "}
					{dayjs(log.createdAt).fromNow()}
				</Text>
			</div>
			{renderBody()}
		</div>
	);
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

/** Mục có khối giá trị hay không, xen kẽ để skeleton trông giống timeline thật */
const SKELETON_ITEMS = [true, false, true];

/** Skeleton cùng bố cục với timeline (dot, avatar, tên, nhãn hành động, thời gian, khối giá trị) để khi tải xong không bị nhảy layout */
function HistorySkeleton({ fillHeight }: { fillHeight: boolean }) {
	return (
		<div className={fillHeight ? "px-6 pt-4" : "py-4"}>
			<div className="mb-6 flex items-center gap-2">
				<Skeleton.Avatar active size={16} />
				<Skeleton.Input active size="small" style={{ width: 180, minWidth: 180 }} />
			</div>
			{SKELETON_ITEMS.map((hasBody, index) => (
				// eslint-disable-next-line react/no-array-index-key -- danh sách tĩnh, không đổi thứ tự
				<div key={index} className="flex gap-3 pb-6">
					<Skeleton.Avatar active size={24} />
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton.Avatar active size={20} />
							<Skeleton.Input active size="small" style={{ width: 110, minWidth: 110 }} />
							<Skeleton.Button active size="small" style={{ width: 64, minWidth: 64 }} />
							<Skeleton.Input active size="small" style={{ width: 150, minWidth: 150 }} />
						</div>
						{hasBody && (
							<div className="flex flex-col gap-2 rounded-md border border-solid border-colorBorderSecondary bg-colorFillTertiary px-3 py-2">
								<Skeleton.Input active size="small" style={{ width: 60, minWidth: 60, height: 12 }} />
								<Skeleton.Input active size="small" style={{ width: 200, minWidth: 200 }} />
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ActivityHistoryProps extends DisplayOptions {
	/** Key của react-query, phải khác nhau giữa các đối tượng */
	queryKey: unknown[]
	fetcher: () => Promise<{ data: ActivityLogEntity[] }>
	/** false thì chưa tải (vd. tab chưa mở) */
	active?: boolean
	/**
	 * true: chiếm hết chiều cao khung cha, tiêu đề đứng yên và chỉ timeline cuộn.
	 * Khung cha cần có chiều cao xác định và không có padding ngang, để thanh cuộn nằm sát mép (component tự chừa lề 24px).
	 */
	fillHeight?: boolean
}

/** Timeline lịch sử thao tác lấy từ activity log: ai làm gì, lúc nào, giá trị trước và sau. */
export function ActivityHistory({ queryKey, fetcher, active = true, fillHeight = false, ...options }: ActivityHistoryProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: fetcher,
		enabled: active,
		staleTime: 30_000,
	});

	const logs: ActivityLogEntity[] = data?.data ?? [];

	if (isLoading) {
		return <HistorySkeleton fillHeight={fillHeight} />;
	}

	if (logs.length === 0) {
		return (
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description={t("common.history.noRecords")}
				className="py-10"
			/>
		);
	}

	/** Màu đậm theo theme cho icon của timeline (màu mặc định antd gán cho dot tùy chỉnh khá nhạt) */
	const dotColors: Record<string, string> = {
		green: token.colorSuccess,
		red: token.colorError,
		blue: token.colorPrimary,
		purple: token.purple,
		cyan: token.cyan,
		orange: token.orange,
	};

	const timelineItems = logs.map((log) => {
		const dotColor = dotColors[ACTION_COLORS[log.action]] ?? token.colorPrimary;
		return {
			key: log.id,
			dot: (
				// Cố định kích thước bằng inline style: khung dot của antd đặt line-height/padding làm vòng tròn bị méo
				<span
					className="inline-flex items-center justify-center rounded-full"
					style={{
						width: 24,
						height: 24,
						minWidth: 24,
						flexShrink: 0,
						lineHeight: 1,
						fontSize: 13,
						color: dotColor,
						backgroundColor: `${dotColor}1f`,
					}}
				>
					{ACTION_ICONS[log.action] ?? <EditOutlined />}
				</span>
			),
			children: <ActivityItem log={log} options={options} />,
		};
	});

	return (
		<div className={fillHeight ? "flex h-full min-h-0 flex-col pt-4" : "py-4"}>
			<div className={`flex shrink-0 items-center gap-2 mb-4 ${fillHeight ? "px-6" : ""}`}>
				<HistoryOutlined />
				<Title level={5} className="mb-0!">
					{t("common.history.title")}
					<Text type="secondary" className="text-sm font-normal ml-2">
						{`(${logs.length} ${t("common.history.records")})`}
					</Text>
				</Title>
			</div>
			{fillHeight
				? (
					// Lề nằm trong vùng cuộn để thanh cuộn sát mép; pt-2 chừa chỗ cho vòng tròn của dot đầu tiên, pb-6 để mục cuối không sát đáy
					<div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
						<Timeline items={timelineItems} />
					</div>
				)
				: <Timeline items={timelineItems} />}
		</div>
	);
}
