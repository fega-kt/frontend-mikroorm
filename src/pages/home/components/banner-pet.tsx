import type { CSSProperties, Ref } from "react";

import { theme } from "antd";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createUseStyles } from "react-jss";

const PET_WIDTH = 64;
const SPEED = { walk: 55, run: 260 }; // px/s
/** Tối đa bao nhiêu chặng đi thường thì bắt buộc một lần đi ra mép đâm tường */
const MAX_TRIPS_BEFORE_WALL = 3;
const JUMP_MS = 650;
/** Thời gian hiện bong bóng thoại */
const BUBBLE_MS = 3500;
/** Bấm liên tục trong khoảng này mới tính là "chọc" */
const CLICK_WINDOW_MS = 2500;
const ANGRY_CLICKS = 5;
const RUNAWAY_CLICKS = 10;

/**
 * walk/toWall/runaway: đang di chuyển (toWall = đi bình thường nhưng đích là mép banner → đâm tường, runaway = bỏ chạy khỏi banner)
 * away: đã chạy khuất, chờ quay lại
 * còn lại: đứng tại chỗ một lúc rồi chuyển trạng thái
 */
type PetMode = "walk" | "toWall" | "runaway" | "away" | "sit" | "sleep" | "dizzy" | "angry" | "celebrate" | "sad";

const MOVING_MODES: PetMode[] = ["walk", "toWall", "runaway"];

const useStyles = createUseStyles({
	"@keyframes petLegA": { "0%, 100%": { transform: "rotate(18deg)" }, "50%": { transform: "rotate(-18deg)" } },
	"@keyframes petLegB": { "0%, 100%": { transform: "rotate(-18deg)" }, "50%": { transform: "rotate(18deg)" } },
	"@keyframes petBob": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-1.5px)" } },
	"@keyframes petTail": { "0%, 100%": { transform: "rotate(-8deg)" }, "50%": { transform: "rotate(14deg)" } },
	"@keyframes petBlink": { "0%, 92%, 100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.1)" } },
	"@keyframes petJump": {
		"0%, 100%": { transform: "translateY(0) scale(1, 1)" },
		"15%": { transform: "translateY(0) scale(1.1, 0.85)" },
		"45%": { transform: "translateY(-26px) scale(0.95, 1.08)" },
		"80%": { transform: "translateY(0) scale(1.08, 0.9)" },
	},
	"@keyframes petSway": { "0%, 100%": { transform: "rotate(-9deg)" }, "50%": { transform: "rotate(9deg)" } },
	"@keyframes petShake": { "0%, 100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-2px)" }, "75%": { transform: "translateX(2px)" } },
	"@keyframes petBreath": { "0%, 100%": { transform: "scale(1, 1)" }, "50%": { transform: "scale(1.02, 1.05)" } },
	"@keyframes petSpin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
	"@keyframes petZzz": {
		"0%": { opacity: 0, transform: "translate(0, 0) scale(0.6)" },
		"30%": { opacity: 1 },
		"100%": { opacity: 0, transform: "translate(14px, -26px) scale(1.2)" },
	},
	"@keyframes petFly": {
		"0%": { opacity: 0, transform: "translate(0, 0) scale(0.4) rotate(0deg)" },
		"15%": { opacity: 1 },
		"100%": { opacity: 0, transform: "translate(var(--dx), var(--dy)) scale(1) rotate(var(--rot))" },
	},
	"@keyframes petBubble": {
		"0%": { opacity: 0, transform: "translate(-50%, 6px) scale(0.8)" },
		"12%, 85%": { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
		"100%": { opacity: 0, transform: "translate(-50%, -4px) scale(0.95)" },
	},
	"track": { position: "absolute", left: 0, right: 0, bottom: 0, height: 60, pointerEvents: "none" },
	"mover": { position: "absolute", left: 0, bottom: 2, width: PET_WIDTH, willChange: "transform" },
	"pet": {
		"display": "block",
		"padding": 0,
		"border": 0,
		"background": "transparent",
		"cursor": "pointer",
		"pointerEvents": "auto",
		"transformOrigin": "50% 100%",
		"&:focus-visible": { outline: "2px solid currentColor", outlineOffset: 2, borderRadius: 8 },
	},
	"jumping": { animation: `$petJump ${JUMP_MS}ms ease-out` },
	"dancing": { animation: "$petJump 0.55s ease-out infinite" },
	"flip": { transform: "scaleX(-1)" },
	"svg": { display: "block", overflow: "visible" },
	"legA": { transformBox: "fill-box", transformOrigin: "50% 0", transition: "opacity 0.3s" },
	"legB": { transformBox: "fill-box", transformOrigin: "50% 0", transition: "opacity 0.3s" },
	"body": { transformBox: "fill-box", transformOrigin: "50% 100%" },
	"tail": { transformBox: "fill-box", transformOrigin: "100% 100%", animation: "$petTail 1.6s ease-in-out infinite" },
	"eye": { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "$petBlink 4s infinite" },
	"walking": {
		"& $legA": { animation: "$petLegA 0.42s ease-in-out infinite" },
		"& $legB": { animation: "$petLegB 0.42s ease-in-out infinite" },
		"& $body": { animation: "$petBob 0.21s ease-in-out infinite" },
	},
	"running": {
		"& $legA, & $legB": { animationDuration: "0.18s" },
		"& $body": { animationDuration: "0.09s" },
	},
	"sitting": { "& $tail": { animationDuration: "0.5s" } },
	"sleeping": {
		"& $body": { animation: "$petBreath 2.4s ease-in-out infinite" },
		"& $tail": { animationDuration: "4s" },
	},
	"dizzy": { "& $body": { animation: "$petSway 0.5s ease-in-out infinite" } },
	"sad": {
		"& $tail": { animationDuration: "3.2s" },
		"& $body": { transform: "translateY(1px)" },
	},
	"angry": {
		"& $body": { animation: "$petShake 0.12s linear infinite" },
		"& $tail": { animationDuration: "0.2s" },
	},
	"stars": { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "$petSpin 1s linear infinite" },
	"float": { position: "absolute", left: "50%", top: 0, pointerEvents: "none", animation: "$petFly 1.1s ease-out forwards" },
	"zzz": {
		position: "absolute",
		right: 0,
		top: 4,
		fontSize: 12,
		fontWeight: 700,
		pointerEvents: "none",
		animation: "$petZzz 2s ease-out infinite",
	},
	"bubble": {
		position: "absolute",
		left: "50%",
		bottom: "100%",
		marginBottom: 6,
		whiteSpace: "nowrap",
		padding: "4px 10px",
		borderRadius: 999,
		fontSize: 12,
		fontWeight: 500,
		pointerEvents: "none",
		animation: `$petBubble ${BUBBLE_MS}ms ease-out forwards`,
	},
	"@media (prefers-reduced-motion: reduce)": {
		walking: { "& $legA, & $legB, & $body": { animation: "none" } },
		tail: { animation: "none" },
		eye: { animation: "none" },
		jumping: { animation: "none" },
		dancing: { animation: "none" },
		zzz: { animation: "none" },
		bubble: { animation: "none" },
		float: { animation: "none", opacity: 0 },
	},
});

interface Particle { id: number, text: string, color: string, dx: number, dy: number, rot: number }

export interface BannerPetRef {
	/** Gọi sau mỗi lần duyệt: mèo nhảy ăn mừng, `allDone` = duyệt hết thì nhảy múa + pháo giấy */
	celebrate: (allDone: boolean) => void
	/** Gọi sau mỗi lần từ chối: mèo buồn, rơi nước mắt và nói câu buồn */
	sadden: () => void
}

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Chú mèo sống dưới chân banner — đi dạo, đâm tường, ngủ gật, ăn mừng khi duyệt, bị chọc nhiều thì cáu / bỏ chạy */
export function BannerPet({ ref }: { ref?: Ref<BannerPetRef> }) {
	const classes = useStyles();
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const trackRef = useRef<HTMLDivElement>(null);
	const moverRef = useRef<HTMLDivElement>(null);
	const [mode, setModeState] = useState<PetMode>("sit");
	const [facingLeft, setFacingLeft] = useState(false);
	const [jumping, setJumping] = useState(false);
	const [particles, setParticles] = useState<Particle[]>([]);
	const [bubble, setBubble] = useState<{ id: number, text: string }>();

	// Trạng thái mô phỏng sống ngoài React để vòng rAF không re-render mỗi khung hình
	const sim = useRef({ x: 0, target: 0, mode: "sit" as PetMode, until: 0, speed: SPEED.walk, facingLeft: false });
	const clicks = useRef<number[]>([]);
	// Không ai tương tác (bấm mèo / duyệt) quá sleepAfter thì mèo đi ngủ
	const idleSince = useRef(performance.now());
	const sleepAfter = useRef(random(5000, 10000));
	const touch = () => {
		idleSince.current = performance.now();
		sleepAfter.current = random(5000, 10000);
	};
	const reducedMotion = useRef(false);
	// Ẩn bong bóng / kết thúc cú nhảy bằng hẹn giờ — không dựa vào animationend (không bắn khi animation bị tắt)
	const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const jumpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const maxX = () => Math.max(0, (trackRef.current?.clientWidth ?? 0) - PET_WIDTH);

	const setMode = (next: PetMode, durationMs = 0) => {
		sim.current.mode = next;
		sim.current.until = performance.now() + durationMs;
		setModeState(next);
	};

	const moveTo = (next: "walk" | "toWall" | "runaway", target: number) => {
		const s = sim.current;
		s.target = target;
		s.speed = next === "runaway" ? SPEED.run : SPEED.walk;
		if (target !== s.x)
			s.facingLeft = target < s.x;
		setFacingLeft(s.facingLeft);
		setMode(next);
	};

	// Hạn hiện tại của bong bóng — để câu tự nói khi đi dạo không đè lên câu đang hiện
	const bubbleUntil = useRef(0);

	const say = (text: string) => {
		clearTimeout(bubbleTimer.current);
		setBubble({ id: Date.now(), text });
		bubbleUntil.current = performance.now() + BUBBLE_MS;
		bubbleTimer.current = setTimeout(() => setBubble(undefined), BUBBLE_MS);
	};

	const jump = () => {
		clearTimeout(jumpTimer.current);
		setJumping(true);
		jumpTimer.current = setTimeout(() => setJumping(false), JUMP_MS);
	};

	const emit = (count: number, options: { texts: string[], colors: string[], spread: number, rise: [number, number] }) => {
		const base = Date.now();
		const items = Array.from({ length: count }, (_, i) => ({
			id: base + i,
			text: pick(options.texts),
			color: pick(options.colors),
			dx: random(-options.spread, options.spread),
			dy: -random(options.rise[0], options.rise[1]),
			rot: random(-200, 200),
		}));
		setParticles(prev => [...prev, ...items]);
		setTimeout(() => setParticles(prev => prev.filter(item => item.id < base || item.id >= base + count)), 1200);
	};

	const tears = () => emit(2, { texts: ["💧"], colors: [token.blue5], spread: 10, rise: [-26, -16] });
	const hearts = () => emit(3, { texts: ["♥"], colors: [token.magenta5, token.red5], spread: 20, rise: [36, 50] });
	const confetti = () => emit(18, { texts: ["■", "●", "▲", "★"], colors: [token.colorPrimary, token.gold5, token.magenta5, token.cyan5, token.green5, token.purple5], spread: 70, rise: [30, 70] });
	const cheers = (key: string) => {
		const list = t(key, { returnObjects: true });
		return Array.isArray(list) ? pick(list as string[]) : String(list);
	};

	// Vòng đời: di chuyển + tự chuyển trạng thái theo thời gian
	useEffect(() => {
		const mover = moverRef.current;
		if (!mover)
			return;
		const s = sim.current;
		s.x = maxX() * 0.35;
		s.until = performance.now() + 1500;
		const place = () => {
			mover.style.transform = `translateX(${s.x}px)`;
		};
		place();

		// Giảm chuyển động: mèo không đi lại, nhưng vòng lặp vẫn chạy để các trạng thái (cáu, ngủ…) tự kết thúc
		reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let last = performance.now();
		let frame = 0;
		let tripsSinceWall = 0;
		// Lúc nào được tự nói câu tiếp theo khi đang đi dạo
		let nextChatterAt = performance.now() + random(5000, 9000);

		// Đi tới một điểm ngẫu nhiên, cách chỗ hiện tại ít nhất 100px cho khỏi lắt nhắt
		const wander = (from: number, to: number) => {
			let target = random(from, to);
			for (let attempt = 0; attempt < 5 && Math.abs(target - s.x) < 100; attempt++)
				target = random(from, to);
			tripsSinceWall++;
			moveTo("walk", target);
		};

		// Cứ đi tiếp theo hướng đang đi (tốc độ thường) tới mép thì đâm tường
		const walkToWall = () => {
			tripsSinceWall = 0;
			const wall = s.facingLeft ? 0 : maxX();
			// Đang đứng sát mép đó rồi thì quay sang mép bên kia
			moveTo("toWall", Math.abs(wall - s.x) < 40 ? maxX() - wall : wall);
		};

		// Chọn việc tiếp theo — chủ yếu là đi tiếp ngay để mèo luôn chạy nhảy
		const next = () => {
			const roll = Math.random();
			if (tripsSinceWall >= MAX_TRIPS_BEFORE_WALL || roll < 0.25)
				walkToWall();
			else if (roll < 0.85)
				wander(0, maxX());
			else
				setMode("sit", random(1000, 2000));
		};

		const tick = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.1);
			last = now;

			if (!document.hidden) {
				const limit = maxX();
				// Rảnh quá lâu → nằm ngủ ngay tại chỗ, ngủ mãi tới khi bị bấm (until = Infinity nên vòng lặp không tự đánh thức)
				if ((s.mode === "walk" || s.mode === "sit") && now - idleSince.current >= sleepAfter.current) {
					setMode("sleep", Infinity);
					place();
				}

				// Thỉnh thoảng tự nói một câu khi đang đi dạo
				if (s.mode === "walk" && now >= nextChatterAt && now >= bubbleUntil.current) {
					say(cheers("home.pet.chatter"));
					nextChatterAt = now + random(8000, 15000);
				}

				if (MOVING_MODES.includes(s.mode)) {
					const step = s.speed * dt;
					if (Math.abs(s.target - s.x) > step) {
						s.x += Math.sign(s.target - s.x) * step;
					}
					else {
						s.x = s.target;
						if (s.mode === "toWall") {
							// Đâm tường → bật ngược lại chút rồi chóng mặt
							s.x += s.target > 0 ? -10 : 10;
							setMode("dizzy", 2000);
							say(t("home.pet.bonk"));
						}
						else if (s.mode === "runaway") {
							setMode("away", 6000);
						}
						else {
							next();
						}
					}
					place();
				}
				else if (now >= s.until) {
					if (s.mode === "away") {
						// Quay lại từ mép trái
						s.x = -PET_WIDTH - 10;
						place();
						wander(40, Math.max(60, limit * 0.5));
					}
					else if (reducedMotion.current) {
						// Giảm chuyển động: chỉ ngồi / thỉnh thoảng ngủ, không đi lại
						setMode("sit", random(5000, 10000));
					}
					else if (s.mode === "dizzy") {
						// Lảo đảo đi ra xa bức tường
						wander(s.x > limit / 2 ? limit * 0.1 : limit * 0.4, s.x > limit / 2 ? limit * 0.6 : limit * 0.9);
					}
					else {
						// sit / sleep / angry / celebrate xong thì đi tiếp ngay
						next();
					}
				}
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);

		const handleResize = () => {
			if (s.mode === "away" || s.mode === "runaway")
				return;
			s.x = Math.min(s.x, maxX());
			s.target = Math.min(s.target, maxX());
			place();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", handleResize);
			clearTimeout(bubbleTimer.current);
			clearTimeout(jumpTimer.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- vòng đời chạy một lần, các helper chỉ đọc ref
	}, []);

	// Trang chủ gọi trực tiếp khi người dùng bấm Duyệt
	useImperativeHandle(ref, () => ({
		celebrate: (allDone) => {
			const s = sim.current;
			if (s.mode === "away" || s.mode === "runaway")
				return;
			// Đang ngủ thì nói mớ rồi ngủ tiếp — chỉ bấm vào mèo mới đánh thức được
			if (s.mode === "sleep") {
				say(cheers(allDone ? "home.pet.sleepTalkAllDone" : "home.pet.sleepTalk"));
				return;
			}
			touch();
			if (allDone) {
				setMode("celebrate", 2600);
				confetti();
				say(t("home.pet.allDone"));
			}
			else {
				jump();
				hearts();
				say(cheers("home.pet.approved"));
			}
		},
		sadden: () => {
			const s = sim.current;
			if (s.mode === "away" || s.mode === "runaway")
				return;
			// Đang ngủ thì nói mớ buồn rồi ngủ tiếp
			if (s.mode === "sleep") {
				say(cheers("home.pet.sleepTalkRejected"));
				return;
			}
			touch();
			setMode("sad", 2600);
			tears();
			say(cheers("home.pet.rejected"));
		},
	}));

	const handleClick = () => {
		touch();
		const s = sim.current;
		if (s.mode === "away" || s.mode === "runaway")
			return;

		const now = performance.now();
		clicks.current = [...clicks.current.filter(time => now - time < CLICK_WINDOW_MS), now];
		const count = clicks.current.length;

		if (count >= RUNAWAY_CLICKS) {
			clicks.current = [];
			say(t("home.pet.runaway"));
			if (reducedMotion.current)
				setMode("angry", 3000);
			else
				moveTo("runaway", maxX() + PET_WIDTH * 2);
			return;
		}
		if (count === ANGRY_CLICKS) {
			setMode("angry", 1800);
			say(t("home.pet.angry"));
			return;
		}
		if (s.mode === "angry")
			return;
		if (s.mode === "sleep") {
			jump();
			setMode("sit", 1500);
			// Bị đánh thức → chống chế "không có lười"
			say(cheers("home.pet.wakeUp"));
			return;
		}
		jump();
		hearts();
		say(cheers("home.pet.cheers"));
	};

	const moving = MOVING_MODES.includes(mode);
	const svgClass = [
		classes.svg,
		moving && classes.walking,
		mode === "runaway" && classes.running,
		mode === "sit" && classes.sitting,
		mode === "sleep" && classes.sleeping,
		mode === "dizzy" && classes.dizzy,
		mode === "angry" && classes.angry,
		mode === "sad" && classes.sad,
	].filter(Boolean).join(" ");

	const fur = token.orange5;
	const furDark = token.orange6;
	const stripe = token.orange7;
	const light = token.orange2;
	const pink = token.magenta3;
	const ink = "#262626";

	// Tư thế: ngủ = cuộn tròn, ngồi = ngồi thẳng, còn lại = đứng 4 chân
	const pose: "stand" | "sit" | "sleep" = mode === "sleep" ? "sleep" : mode === "sit" ? "sit" : "stand";

	/** Mắt theo tâm trạng, (cx, cy) là giữa hai mắt */
	const renderEyes = (cx: number, cy: number) => {
		const l = cx - 5;
		const r = cx + 5;
		if (mode === "sleep")
			return <path d={`M${l - 2} ${cy} q2 1.8 4 0 M${r - 2} ${cy} q2 1.8 4 0`} stroke={ink} strokeWidth="1.3" strokeLinecap="round" fill="none" />;
		if (mode === "celebrate")
			return <path d={`M${l - 2} ${cy + 1} q2 -2.6 4 0 M${r - 2} ${cy + 1} q2 -2.6 4 0`} stroke={ink} strokeWidth="1.4" strokeLinecap="round" fill="none" />;
		if (mode === "dizzy")
			return <path d={`M${l - 1.6} ${cy - 1.6} l3.2 3.2 m0 -3.2 l-3.2 3.2 M${r - 1.6} ${cy - 1.6} l3.2 3.2 m0 -3.2 l-3.2 3.2`} stroke={ink} strokeWidth="1.3" strokeLinecap="round" />;
		if (mode === "sad") {
			return (
				<g strokeLinecap="round">
					<path d={`M${l - 2.4} ${cy - 2.6} l4 -1.6 M${r + 2.4} ${cy - 2.6} l-4 -1.6`} stroke={ink} strokeWidth="1.3" />
					<path d={`M${l - 2} ${cy + 0.6} q2 -1.6 4 0 M${r - 2} ${cy + 0.6} q2 -1.6 4 0`} stroke={ink} strokeWidth="1.3" fill="none" />
					<path d={`M${l - 0.4} ${cy + 2.4} q-1.4 2 0 3 q1.4 -1 0 -3 z`} fill={token.blue4} />
				</g>
			);
		}
		if (mode === "angry") {
			return (
				<g stroke={ink} strokeWidth="1.4" strokeLinecap="round">
					<path d={`M${l - 2.4} ${cy - 3.6} l4 1.6 M${r + 2.4} ${cy - 3.6} l-4 1.6`} />
					<path d={`M${l - 1.6} ${cy} h3.2 M${r - 1.6} ${cy} h3.2`} />
				</g>
			);
		}
		return (
			<>
				{[l, r].map(x => (
					<g key={x} className={classes.eye}>
						<ellipse cx={x} cy={cy} rx="2.1" ry="2.7" fill={ink} />
						<circle cx={x + 0.7} cy={cy - 1} r="0.8" fill="#fff" />
					</g>
				))}
			</>
		);
	};

	/** Đầu chibi, (hx, hy) là tâm đầu */
	const renderHead = (hx: number, hy: number) => (
		<g>
			{/* Tai */}
			<path d={`M${hx - 11} ${hy - 2} Q${hx - 12} ${hy - 14} ${hx - 3.5} ${hy - 9} Z`} fill={fur} />
			<path d={`M${hx + 3.5} ${hy - 9} Q${hx + 12} ${hy - 14} ${hx + 11} ${hy - 2} Z`} fill={fur} />
			<path d={`M${hx - 9.5} ${hy - 4} Q${hx - 10} ${hy - 11} ${hx - 5} ${hy - 8.4} Z M${hx + 5} ${hy - 8.4} Q${hx + 10} ${hy - 11} ${hx + 9.5} ${hy - 4} Z`} fill={pink} opacity="0.8" />
			{/* Mặt */}
			<ellipse cx={hx} cy={hy} rx="12" ry="10.5" fill={fur} />
			<path d={`M${hx - 2.4} ${hy - 10} v3 M${hx} ${hy - 10.5} v3.6 M${hx + 2.4} ${hy - 10} v3`} stroke={stripe} strokeWidth="1.5" strokeLinecap="round" />
			<ellipse cx={hx} cy={hy + 4.2} rx="5.5" ry="3.6" fill={light} />
			{renderEyes(hx, hy + 0.5)}
			{/* Mũi + miệng ω */}
			<path d={`M${hx - 1.2} ${hy + 2.8} h2.4 l-1.2 1.3 z`} fill={token.magenta5} />
			{mode === "sad"
				? <path d={`M${hx - 2.2} ${hy + 5.8} q2.2 -1.8 4.4 0`} stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" />
				: <path d={`M${hx - 2.4} ${hy + 4.4} q1.2 1.5 2.4 0 q1.2 1.5 2.4 0`} stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" />}
			{/* Ria */}
			<path d={`M${hx - 7} ${hy + 3} l-6 -1 M${hx - 7} ${hy + 4.4} l-6 1 M${hx + 7} ${hy + 3} l6 -1 M${hx + 7} ${hy + 4.4} l6 1`} stroke={ink} strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
			{mode !== "angry" && (
				<>
					<ellipse cx={hx - 8} cy={hy + 3.6} rx="2" ry="1.2" fill={pink} opacity="0.6" />
					<ellipse cx={hx + 8} cy={hy + 3.6} rx="2" ry="1.2" fill={pink} opacity="0.6" />
				</>
			)}
			{mode === "angry" && (
				<path d={`M${hx + 9} ${hy - 13} l2 2 m2 -2 l-2 2 m0 0 l-2 2 m2 -2 l2 2`} stroke={token.colorError} strokeWidth="1.6" strokeLinecap="round" />
			)}
			{mode === "dizzy" && (
				<g className={classes.stars}>
					<circle cx={hx} cy={hy - 15} r="13" fill="none" stroke="transparent" />
					<text x={hx - 14} y={hy - 12} fontSize="10" fill={token.gold5}>★</text>
					<text x={hx + 6} y={hy - 18} fontSize="9" fill={token.gold5}>★</text>
					<text x={hx + 12} y={hy - 6} fontSize="8" fill={token.gold5}>★</text>
				</g>
			)}
		</g>
	);

	/** Chân có bàn chân màu sáng, xoay quanh khớp trên khi đi */
	const renderLeg = (x: number, className: string, color: string) => (
		<g className={className}>
			<rect x={x} y="35" width="5.5" height="9" rx="2.75" fill={color} />
			<ellipse cx={x + 2.75} cy="43.6" rx="3.2" ry="1.9" fill={light} />
		</g>
	);

	return (
		<div ref={trackRef} className={classes.track}>
			<div ref={moverRef} className={classes.mover}>
				{bubble && (
					<span
						key={bubble.id}
						className={classes.bubble}
						style={{ background: token.colorBgElevated, color: token.colorText, boxShadow: token.boxShadowSecondary }}
					>
						{bubble.text}
					</span>
				)}
				{particles.map(item => (
					<span
						key={item.id}
						aria-hidden="true"
						className={classes.float}
						style={{ "color": item.color, "fontSize": item.text === "♥" ? 14 : 9, "--dx": `${item.dx}px`, "--dy": `${item.dy}px`, "--rot": `${item.rot}deg` } as CSSProperties}
					>
						{item.text}
					</span>
				))}
				{mode === "sleep" && (
					<span aria-hidden="true" className={classes.zzz} style={{ color: token.colorTextTertiary }}>z</span>
				)}
				<button
					type="button"
					aria-label={t("home.pet.label")}
					className={`${classes.pet} ${mode === "celebrate" ? classes.dancing : jumping ? classes.jumping : ""}`}
					style={{ color: token.colorPrimary }}
					onClick={handleClick}
				>
					<span className={`block ${facingLeft ? classes.flip : ""}`}>
						<svg width={PET_WIDTH} height="48" viewBox="0 0 64 48" className={svgClass} aria-hidden="true">
							{/* Bóng dưới chân */}
							<ellipse cx={pose === "sit" ? 34 : 32} cy="46.5" rx={pose === "sleep" ? 22 : 18} ry="1.8" fill="#000" opacity="0.12" />

							{pose === "stand" && (
								<>
									{renderLeg(15, classes.legB, furDark)}
									{renderLeg(33, classes.legA, furDark)}
									<g className={classes.body}>
										<g className={classes.tail}>
											<path d="M13 30 C4 30 2 18 7 12" stroke={fur} strokeWidth="5.5" strokeLinecap="round" fill="none" />
											<path d="M7.6 14.6 C7 13.6 7 12.8 7 12" stroke={stripe} strokeWidth="5.5" strokeLinecap="round" fill="none" />
										</g>
										{/* Thân — cáu thì xù lông */}
										<ellipse cx="28" cy="31" rx={mode === "angry" ? 17.5 : 16} ry={mode === "angry" ? 11 : 9.5} fill={fur} />
										<ellipse cx="29" cy="35" rx="9" ry="4" fill={light} />
										<path d="M21 22.6 q1.6 3 0 6 M27 22 q1.6 3 0 6.2 M33 22.6 q1.6 3 0 6" stroke={stripe} strokeWidth="1.8" strokeLinecap="round" fill="none" />
										{renderHead(48, 18)}
									</g>
									{renderLeg(19, classes.legA, fur)}
									{renderLeg(37, classes.legB, fur)}
								</>
							)}

							{pose === "sit" && (
								<g className={classes.body}>
									<g className={classes.tail}>
										<path d="M26 44 C14 46 10 38 15 33" stroke={fur} strokeWidth="5" strokeLinecap="round" fill="none" />
										<path d="M15.8 35 C15.2 34.2 15 33.6 15 33" stroke={stripe} strokeWidth="5" strokeLinecap="round" fill="none" />
									</g>
									{/* Đùi sau + thân ngồi thẳng */}
									<ellipse cx="27" cy="39" rx="7.5" ry="6.5" fill={furDark} />
									<ellipse cx="34" cy="34" rx="10.5" ry="11.5" fill={fur} />
									<ellipse cx="35" cy="37" rx="6" ry="7" fill={light} />
									<path d="M27.5 27 q1.4 2.4 0 5 M26.6 33 q1.4 2.4 0 5" stroke={stripe} strokeWidth="1.6" strokeLinecap="round" fill="none" />
									{/* Chân trước thẳng */}
									<rect x="31" y="36" width="4.6" height="9" rx="2.3" fill={fur} />
									<rect x="37" y="36" width="4.6" height="9" rx="2.3" fill={fur} />
									<ellipse cx="33.3" cy="44.6" rx="2.8" ry="1.6" fill={light} />
									<ellipse cx="39.3" cy="44.6" rx="2.8" ry="1.6" fill={light} />
									{renderHead(37, 16)}
								</g>
							)}

							{pose === "sleep" && (
								<g className={classes.body}>
									{/* Thân cuộn tròn kiểu ổ bánh mì */}
									<ellipse cx="29" cy="38.5" rx="19" ry="8.5" fill={fur} />
									<path d="M20 31 q1.6 2.6 0 5.2 M26 30.4 q1.6 2.6 0 5.4 M32 31 q1.6 2.6 0 5.2" stroke={stripe} strokeWidth="1.8" strokeLinecap="round" fill="none" />
									{/* Đuôi quấn ra phía trước */}
									<g className={classes.tail}>
										<path d="M11 40 C6 47 24 47.5 36 45.5" stroke={furDark} strokeWidth="5" strokeLinecap="round" fill="none" />
										<path d="M33 45.9 C34.4 45.8 35.2 45.7 36 45.5" stroke={stripe} strokeWidth="5" strokeLinecap="round" fill="none" />
									</g>
									{/* Chân trước kê dưới cằm */}
									<ellipse cx="43" cy="44" rx="4" ry="2.4" fill={light} />
									<ellipse cx="51" cy="44" rx="4" ry="2.4" fill={light} />
									{renderHead(47, 34)}
								</g>
							)}
						</svg>
					</span>
				</button>
			</div>
		</div>
	);
}
