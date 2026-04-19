import type { ProjectStats } from "#src/api/project/types";
import { projectService } from "#src/api/project";
import {
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	RiseOutlined,
	UnorderedListOutlined,
} from "@ant-design/icons";
import { Avatar, Col, Progress, Row, Spin, theme, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface ProjectStatsProps {
	projectId: string
}

export function ProjectStatsPanel({ projectId }: ProjectStatsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [stats, setStats] = useState<ProjectStats | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const data = await projectService.fetchProjectStats(projectId);
				setStats(data);
			}
			catch (err) {
				console.error(err);
			}
			finally {
				setLoading(false);
			}
		};
		load();
	}, [projectId]);

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<Spin />
			</div>
		);
	}

	if (!stats)
		return null;

	const statCards = [
		{
			title: t("project.stats.total"),
			value: stats.total,
			icon: <UnorderedListOutlined />,
			color: token.colorPrimary,
			bg: token.colorPrimaryBg,
			border: token.colorPrimaryBorder,
		},
		{
			title: t("project.stats.completed"),
			value: stats.completed,
			icon: <CheckCircleOutlined />,
			color: token.colorSuccess,
			bg: token.colorSuccessBg,
			border: token.colorSuccessBorder,
		},
		{
			title: t("project.stats.overdue"),
			value: stats.overdue,
			icon: <ExclamationCircleOutlined />,
			color: token.colorError,
			bg: token.colorErrorBg,
			border: token.colorErrorBorder,
		},
		{
			title: t("project.stats.completion_rate"),
			value: `${Math.round(stats.completionRate)}%`,
			icon: <RiseOutlined />,
			color: token.colorWarning,
			bg: token.colorWarningBg,
			border: token.colorWarningBorder,
		},
	];

	return (
		<div className="py-4">
			<Row gutter={[12, 12]}>
				{statCards.map(card => (
					<Col xs={12} sm={12} md={6} key={card.title}>
						<div
							className="rounded-xl px-4 py-3 flex items-center gap-3 h-full"
							style={{
								background: card.bg,
								border: `1px solid ${card.border}`,
							}}
						>
							<span className="text-xl flex-shrink-0" style={{ color: card.color }}>
								{card.icon}
							</span>
							<div className="min-w-0">
								<div className="text-xl font-bold leading-tight truncate" style={{ color: card.color }}>
									{card.value}
								</div>
								<div className="text-xs leading-tight" style={{ color: token.colorTextSecondary }}>
									{card.title}
								</div>
							</div>
						</div>
					</Col>
				))}
			</Row>

			<div className="mt-5">
				<Text strong className="text-sm block mb-3">
					{t("project.stats.by_assignee")}
				</Text>
				{(stats.byAssignee ?? []).length === 0
					? (
						<Text type="secondary" className="text-sm">
							{t("project.stats.no_assignee")}
						</Text>
					)
					: (
						<div className="flex flex-col gap-2.5">
							{(stats.byAssignee ?? []).map(item => (
								<div key={item.assigneeId} className="flex items-center gap-3">
									<Avatar
										size={24}
										style={{ backgroundColor: token.colorPrimary, flexShrink: 0, fontSize: 11 }}
									>
										{item.assigneeName.charAt(0).toUpperCase()}
									</Avatar>
									<Text className="text-sm w-28 truncate flex-shrink-0">
										{item.assigneeName}
									</Text>
									<Progress
										percent={stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}
										size="small"
										className="flex-1 m-0"
										showInfo={false}
										strokeColor={token.colorPrimary}
									/>
									<Text type="secondary" className="text-xs whitespace-nowrap w-16 text-right">
										{item.count}
										{" "}
										{t("project.stats.tasks")}
									</Text>
								</div>
							))}
						</div>
					)}
			</div>
		</div>
	);
}
