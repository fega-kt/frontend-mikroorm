import type { Editor } from "@tiptap/react";
import {
	BoldOutlined,
	CheckSquareOutlined,
	CodeOutlined,
	ItalicOutlined,
	LinkOutlined,
	MenuOutlined,
	OrderedListOutlined,
	StrikethroughOutlined,
	UnderlineOutlined,
	UnorderedListOutlined,
} from "@ant-design/icons";
import { Divider, theme, Tooltip } from "antd";

interface ToolbarProps {
	editor: Editor | null
}

interface ToolbarBtn {
	key: string
	icon: React.ReactNode
	tip: string
	action: (editor: Editor) => void
	isActive?: (editor: Editor) => boolean
}

const BUTTONS: (ToolbarBtn | "divider")[] = [
	{
		key: "bold",
		icon: <BoldOutlined />,
		tip: "Bold",
		action: e => e.chain().focus().toggleBold().run(),
		isActive: e => e.isActive("bold"),
	},
	{
		key: "italic",
		icon: <ItalicOutlined />,
		tip: "Italic",
		action: e => e.chain().focus().toggleItalic().run(),
		isActive: e => e.isActive("italic"),
	},
	{
		key: "underline",
		icon: <UnderlineOutlined />,
		tip: "Underline",
		action: e => e.chain().focus().toggleUnderline().run(),
		isActive: e => e.isActive("underline"),
	},
	{
		key: "strike",
		icon: <StrikethroughOutlined />,
		tip: "Strikethrough",
		action: e => e.chain().focus().toggleStrike().run(),
		isActive: e => e.isActive("strike"),
	},
	"divider",
	{
		key: "code",
		icon: <CodeOutlined />,
		tip: "Code",
		action: e => e.chain().focus().toggleCode().run(),
		isActive: e => e.isActive("code"),
	},
	{
		key: "blockquote",
		icon: <MenuOutlined />,
		tip: "Blockquote",
		action: e => e.chain().focus().toggleBlockquote().run(),
		isActive: e => e.isActive("blockquote"),
	},
	"divider",
	{
		key: "bulletList",
		icon: <UnorderedListOutlined />,
		tip: "Bullet List",
		action: e => e.chain().focus().toggleBulletList().run(),
		isActive: e => e.isActive("bulletList"),
	},
	{
		key: "orderedList",
		icon: <OrderedListOutlined />,
		tip: "Ordered List",
		action: e => e.chain().focus().toggleOrderedList().run(),
		isActive: e => e.isActive("orderedList"),
	},
	{
		key: "taskList",
		icon: <CheckSquareOutlined />,
		tip: "Task List",
		action: e => e.chain().focus().toggleTaskList().run(),
		isActive: e => e.isActive("taskList"),
	},
	"divider",
	{
		key: "link",
		icon: <LinkOutlined />,
		tip: "Link",
		action: (e) => {
			if (e.isActive("link")) {
				e.chain().focus().unsetLink().run();
			}
			else {
				const url = window.prompt("URL:");
				if (url)
					e.chain().focus().setLink({ href: url }).run();
			}
		},
		isActive: e => e.isActive("link"),
	},
];

export function Toolbar({ editor }: ToolbarProps) {
	const { token } = theme.useToken();

	if (!editor)
		return null;

	return (
		<div
			className="flex items-center gap-0.5 px-2 py-1 flex-wrap"
			style={{
				borderBottom: `1px solid ${token.colorBorderSecondary}`,
				backgroundColor: token.colorBgContainer,
			}}
		>
			{BUTTONS.map((item, idx) => {
				if (item === "divider") {
					return (
						<Divider
							key={`div-${idx}`}
							type="vertical"
							style={{ margin: "0 4px", height: 16, borderColor: token.colorBorderSecondary }}
						/>
					);
				}

				const active = item.isActive?.(editor) ?? false;

				return (
					<Tooltip key={item.key} title={item.tip} mouseEnterDelay={0.5}>
						<button
							type="button"
							onClick={() => item.action(editor)}
							className="flex items-center justify-center rounded cursor-pointer border-none"
							style={{
								width: 28,
								height: 28,
								fontSize: 13,
								backgroundColor: active ? token.colorPrimaryBg : "transparent",
								color: active ? token.colorPrimary : token.colorTextSecondary,
								transition: "all 0.15s",
							}}
							onMouseEnter={(e) => {
								if (!active) {
									e.currentTarget.style.backgroundColor = token.colorFillSecondary;
									e.currentTarget.style.color = token.colorText;
								}
							}}
							onMouseLeave={(e) => {
								if (!active) {
									e.currentTarget.style.backgroundColor = "transparent";
									e.currentTarget.style.color = token.colorTextSecondary;
								}
							}}
						>
							{item.icon}
						</button>
					</Tooltip>
				);
			})}
		</div>
	);
}
