import { usePreferencesStore } from "#src/store/preferences";
import { cn } from "#src/utils/cn";

const appTitle = import.meta.env.VITE_GLOB_APP_TITLE;
const appUrl = import.meta.env.VITE_GLOB_APP_URL || window.location.origin;

interface LayoutFooterProps {
	className?: string
}
export default function LayoutFooter({ className }: LayoutFooterProps) {
	const enableFooter = usePreferencesStore(state => state.enableFooter);
	if (!enableFooter)
		return null;

	return (
		<footer
			className={cn(
				"h-10 flex flex-wrap shrink-0 items-center justify-center text-xs md:text-sm text-colorTextSecondary",
				className,
			)}
		>
			Copyright &copy;&nbsp;
			{new Date().getFullYear()}
			&nbsp;
			{
				appTitle
					? (
						<span>
							<a href={appUrl} rel="noreferrer noopener" target="_blank">
								{appTitle}
								&nbsp;
							</a>
						</span>
					)
					: null
			}
			All right reserved
		</footer>
	);
}
