import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

/** Khung chờ của trang thiết kế quy trình: thanh tiêu đề + bảng node | canvas | bảng thuộc tính */
export function DesignerSkeleton() {
	const { token } = theme.useToken();
	const border = `1px solid ${token.colorBorderSecondary}`;

	return (
		<BasicContent className="h-full">
			<div
				className="flex h-full min-h-[600px] flex-col overflow-hidden"
				style={{ background: token.colorBgContainer, border, borderRadius: token.borderRadiusLG }}
			>
				<div className="flex items-center justify-between gap-4 px-4 py-2.5" style={{ borderBottom: border }}>
					<div className="flex items-center gap-3">
						<Skeleton.Button active size="small" shape="circle" />
						<div className="flex flex-col gap-1.5">
							<Skeleton.Input active size="small" style={{ width: 140, height: 12 }} />
							<Skeleton.Input active size="small" style={{ width: 240 }} />
						</div>
					</div>
					<div className="flex gap-2">
						<Skeleton.Button active style={{ width: 96 }} />
						<Skeleton.Button active style={{ width: 96 }} />
						<Skeleton.Button active style={{ width: 96 }} />
					</div>
				</div>
				<div className="flex min-h-0 flex-1">
					<aside className="flex w-[260px] shrink-0 flex-col gap-2 p-4" style={{ borderRight: border, background: token.colorBgLayout }}>
						<Skeleton.Input active size="small" style={{ width: 120 }} />
						{[0, 1, 2, 3, 4].map(i => <Skeleton.Button key={i} active block style={{ height: 50 }} />)}
					</aside>
					<main className="flex flex-1 flex-col items-center justify-center gap-10" style={{ background: token.colorBgLayout }}>
						{[0, 1, 2].map(i => <Skeleton.Button key={i} active style={{ width: 200, height: 56 }} />)}
					</main>
					<aside className="w-[340px] shrink-0 p-4" style={{ borderLeft: border }}>
						<Skeleton active title={{ width: "50%" }} paragraph={{ rows: 6 }} />
					</aside>
				</div>
			</div>
		</BasicContent>
	);
}
