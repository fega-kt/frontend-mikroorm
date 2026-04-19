import type { ProjectEntity, ProjectStats } from "#src/api/project/types";
import { projectService } from "#src/api/project";
import { CrownOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Badge, Form, Spin, Tag, theme, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface ProjectTeamProps {
	projectId: string
}

function getAvatarColor(id: string, token: any) {
	const colors = [
		token.colorPrimary,
		token.colorSuccess,
		token.colorWarning,
		token.colorError,
		token.colorInfo,
	];
	let hash = 0;
	for (let i = 0; i < id.length; i++)
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	return colors[Math.abs(hash) % colors.length];
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance<ProjectEntity>();
	const owner = form.getFieldValue("owner");

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

	const contributors = (stats?.byAssignee ?? []).filter(a => a.assigneeId !== owner?.id);
	const ownerAsContributor = (stats?.byAssignee ?? []).find(a => a.assigneeId === owner?.id);

	return (
		<div className="py-4 flex flex-col gap-6">
			{/* Owner */}
			{owner && (
				<div>
					<Text type="secondary" className="text-xs uppercase tracking-wide font-semibold block mb-3">
						{t("project.team.owner_label")}
					</Text>
					<div
						className="flex items-center gap-3 px-4 py-3 rounded-xl"
						style={{
							background: token.colorPrimaryBg,
							border: `1px solid ${token.colorPrimaryBorder}`,
						}}
					>
						{owner.avatar
							? (
								<Avatar size={40} src={owner.avatar} />
							)
							: (
								<Avatar
									size={40}
									style={{ backgroundColor: token.colorPrimary, fontSize: 16 }}
								>
									{(owner.fullName || owner.loginName || "?").charAt(0).toUpperCase()}
								</Avatar>
							)}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<Text strong className="text-sm truncate">
									{owner.fullName || owner.loginName}
								</Text>
								<Tag
									icon={<CrownOutlined />}
									color="gold"
									className="text-xs m-0 leading-none"
								>
									Owner
								</Tag>
							</div>
							{owner.workEmail && (
								<Text type="secondary" className="text-xs truncate block">
									{owner.workEmail}
								</Text>
							)}
						</div>
						{ownerAsContributor && (
							<Badge
								count={ownerAsContributor.count}
								style={{ backgroundColor: token.colorPrimary }}
								title={`${ownerAsContributor.count} ${t("project.team.tasks_assigned")}`}
							/>
						)}
					</div>
				</div>
			)}

			{/* Contributors */}
			<div>
				<Text type="secondary" className="text-xs uppercase tracking-wide font-semibold block mb-3">
					{t("project.team.contributors")}
				</Text>
				{contributors.length === 0
					? (
						<div
							className="py-8 text-center rounded-xl"
							style={{
								background: token.colorFillAlter,
								border: `1px dashed ${token.colorBorderSecondary}`,
							}}
						>
							<UserOutlined className="text-2xl mb-2 block" style={{ color: token.colorTextQuaternary }} />
							<Text type="secondary" className="text-sm">
								{t("project.team.no_contributors")}
							</Text>
						</div>
					)
					: (
						<div className="flex flex-col gap-2">
							{contributors.map(member => (
								<div
									key={member.assigneeId}
									className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
									style={{
										background: token.colorFillAlter,
										border: `1px solid ${token.colorBorderSecondary}`,
									}}
								>
									<Avatar
										size={36}
										style={{
											backgroundColor: getAvatarColor(member.assigneeId, token),
											fontSize: 14,
											flexShrink: 0,
										}}
									>
										{member.assigneeName.charAt(0).toUpperCase()}
									</Avatar>
									<Text className="text-sm flex-1 truncate">{member.assigneeName}</Text>
									<Badge
										count={member.count}
										style={{ backgroundColor: token.colorTextQuaternary }}
										title={`${member.count} ${t("project.team.tasks_assigned")}`}
									/>
								</div>
							))}
						</div>
					)}
			</div>
		</div>
	);
}
