import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

function Field({ wide, tall }: { wide?: boolean, tall?: boolean }) {
	return (
		<div className={wide ? "flex flex-col gap-2 lg:col-span-2" : "flex flex-col gap-2"}>
			<Skeleton.Input active size="small" style={{ width: 90, height: 14 }} />
			<Skeleton.Input active block style={{ height: tall ? 100 : 32 }} />
		</div>
	);
}

/** Khung chờ hồ sơ cá nhân: card giữa trang, cột ảnh đại diện + lưới trường thông tin */
export default function MyProfileLoading() {
	const { token } = theme.useToken();
	return (
		<BasicContent className="flex items-start justify-center p-8">
			<div className="w-full max-w-4xl overflow-hidden rounded-2xl" style={{ background: token.colorBgContainer, boxShadow: token.boxShadow }}>
				<div className="px-6 py-5">
					<Skeleton.Input active style={{ width: 160 }} />
				</div>
				<div className="flex gap-6 px-6 pb-3" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
					<Skeleton.Input active size="small" style={{ width: 80 }} />
					<Skeleton.Input active size="small" style={{ width: 80 }} />
				</div>
				<div className="flex flex-col gap-10 p-6 md:flex-row md:gap-12">
					<div className="flex flex-col items-center gap-3 md:w-1/3">
						<Skeleton.Input active size="small" style={{ width: 60, height: 14 }} />
						<Skeleton.Avatar active size={120} />
						<Skeleton.Input active style={{ width: 140 }} />
						<Skeleton.Input active size="small" style={{ width: 180 }} />
					</div>
					<div className="grid flex-1 grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-2">
						<Field wide />
						<Field />
						<Field />
						<Field />
						<Field />
						<Field wide tall />
					</div>
				</div>
			</div>
		</BasicContent>
	);
}
