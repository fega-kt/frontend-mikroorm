import type { ReactNode } from "react";
import { cn } from "#src/utils/cn";
import { theme } from "antd";

export interface Tab {
	key: string
	label: string
	children: ReactNode
}

interface TabBarProps {
	tabs: Tab[]
	activeTab: string
	onChange: (key: string) => void
}

export function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
	const { token } = theme.useToken();
	return (
		<div
			className="flex px-4"
			style={{
				borderTop: `1px solid ${token.colorBorderSecondary}`,
				backgroundColor: token.colorBgContainer,
			}}
		>
			{tabs.map(tab => (
				<button
					key={tab.key}
					type="button"
					onClick={() => onChange(tab.key)}
					className={cn("border-none bg-transparent cursor-pointer px-4 py-2.5 text-sm font-normal transition-colors")}
					style={{
						outline: "none",
						marginBottom: -1,
						borderBottom: activeTab === tab.key
							? `2px solid ${token.colorPrimary}`
							: "2px solid transparent",
						color: activeTab === tab.key ? token.colorPrimary : token.colorTextSecondary,
						fontWeight: activeTab === tab.key ? 500 : 400,
					}}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
