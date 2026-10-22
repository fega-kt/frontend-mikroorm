import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

/** Khung chờ mặc định cho trang chưa có loading.tsx riêng: không giả bảng hay form cụ thể nên không sai với trang nào */
export function PageSkeleton() {
	const { token } = theme.useToken();
	const card = {
		background: token.colorBgContainer,
		border: `1px solid ${token.colorBorderSecondary}`,
		borderRadius: token.borderRadiusLG,
	};

	return (
		<BasicContent className="h-full">
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4 px-6 py-4" style={card}>
					<Skeleton.Input active style={{ width: 200 }} />
					<Skeleton.Button active style={{ width: 96 }} />
				</div>
				<div className="flex flex-col gap-6 p-6" style={card}>
					<Skeleton active title={{ width: "30%" }} paragraph={{ rows: 4, width: ["90%", "75%", "85%", "40%"] }} />
					<Skeleton active title={{ width: "25%" }} paragraph={{ rows: 3, width: ["80%", "65%", "50%"] }} />
				</div>
			</div>
		</BasicContent>
	);
}
