import { useState } from "react";
import { cn } from "@/lib/utils";

// Utility function if cn is not available
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface TestimonialCardProps {
  className?: string;
  avatar?: string;
  username?: string;
  handle?: string;
  content?: string;
  date?: string;
  verified?: boolean;
  likes?: number;
  retweets?: number;
  tweetUrl?: string;
  onHover?: () => void;
  onLeave?: () => void;
  isActive?: boolean;
  onTap?: () => void;
  /** When provided, a click/tap selects the card instead of navigating (e.g. opens a modal). */
  onSelect?: () => void;
  /** Horizontal layout: large icon on the left, details on the right. */
  horizontal?: boolean;
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg
      className="size-4 text-[#1d9bf0]"
      viewBox="0 0 22 22"
      fill="currentColor"
    >
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );
}

function TestimonialCard({
  className,
  avatar,
  username = "PEPE",
  handle = "@PEPE_bigbrother",
  content = "This is amazing! 🔥 Absolutely loving what the team is building here. Can't wait to see what comes next!",
  date = "Jan 5, 2026",
  verified = true,
  likes = 142,
  retweets = 23,
  tweetUrl,
  onHover,
  onLeave,
  isActive,
  onTap,
  onSelect,
  horizontal = false,
}: TestimonialCardProps) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Check if it's a touch device
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (onSelect) {
      // Select mode: open the popup instead of navigating
      e.preventDefault();
      if (isTouchDevice && !isActive) {
        // On mobile: first tap activates & spreads the stack, second tap opens
        onTap?.();
        return;
      }
      onTap?.(); // keep the stack spread after selecting
      onSelect();
      return;
    }

    // Original navigation behavior
    if (isTouchDevice) {
      // On mobile: first tap activates, second tap navigates
      if (!isActive) {
        e.preventDefault();
        onTap?.();
      }
      // If already active, let the link navigate normally
    }
    // On desktop: always navigate (normal link behavior)
  };

  return (
    <a
      href={tweetUrl || undefined}
      target={tweetUrl ? "_blank" : undefined}
      rel={tweetUrl ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "relative flex h-auto min-h-[140px] sm:min-h-[180px] w-[260px] sm:w-[380px] -skew-y-[5deg] select-none rounded-3xl border border-white/10 bg-card/80 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4 transition-all duration-500 hover:border-brand-primary/30 hover:bg-card cursor-pointer",
        horizontal ? "flex-row items-stretch gap-3 sm:gap-4" : "flex-col",
        !horizontal &&
          "dark:after:absolute dark:after:-right-1 dark:after:top-[-5%] dark:after:h-[110%] dark:after:w-[20rem] dark:after:bg-gradient-to-l dark:after:from-background dark:after:to-transparent dark:after:content-[''] dark:after:pointer-events-none",
        isActive && "ring-2 ring-primary/50",
        className
      )}
    >
      {horizontal ? (
        <div className="flex w-28 sm:w-40 shrink-0 items-center justify-center self-stretch overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-3 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(0,245,200,0.08)]">
          {avatar ? (
            <img src={avatar} alt={username} className="h-full w-full object-contain" />
          ) : (
            <span className="text-lg sm:text-2xl">🐸</span>
          )}
        </div>
      ) : (
        <div className="mb-2 flex items-start gap-2 sm:mb-3 sm:gap-3">
          <div className="size-9 sm:size-12 rounded-full bg-black/60 ring-1 ring-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {avatar ? (
              <img src={avatar} alt={username} className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-lg sm:text-2xl">🐸</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-foreground truncate text-xs sm:text-base">{username}</span>
              {verified && <VerifiedBadge />}
            </div>
            <span className="text-muted-foreground text-[10px] sm:text-sm">{handle}</span>
          </div>
          <TwitterIcon className="size-4 sm:size-5 text-foreground shrink-0" />
        </div>
      )}

      {/* Body */}
      <div className={cn("flex min-w-0 flex-1 flex-col", !horizontal && "w-full")}>
        {horizontal ? (
          <div className="mb-1.5 sm:mb-2">
            <span className="font-display text-lg sm:text-2xl font-bold text-foreground truncate">
              {username}
            </span>
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-1 sm:mb-3">
            <span className="font-bold text-foreground truncate text-xs sm:text-base">{username}</span>
            {verified && <VerifiedBadge />}
            <span className="text-muted-foreground text-[10px] sm:text-sm truncate">{handle}</span>
            <TwitterIcon className="size-4 sm:size-5 text-foreground shrink-0 ml-auto" />
          </div>
        )}

        <p className="text-foreground text-xs sm:text-[15px] leading-relaxed mb-2 sm:mb-3 line-clamp-3 sm:line-clamp-4">
          {content}
        </p>

        {/* Footer */}
        {horizontal ? (
          <div className="mt-auto flex items-center gap-2 text-muted-foreground text-[10px] sm:text-xs">
            <span className="mono-chip text-[9px] uppercase tracking-widest">{date}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-muted-foreground text-[10px] sm:text-sm mt-auto">
            <span>{date}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>{retweets}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

interface TestimonialsProps {
  cards?: TestimonialCardProps[];
  /** Called with the card index when a card is clicked to be selected (opens a popup). */
  onSelect?: (index: number) => void;
  /** Called with the hovered/tapped card index (or null when leaving) so the parent can render a live preview. */
  onPreviewChange?: (index: number | null) => void;
}

/**
 * Spread logic for the stacked deck (supports N cards):
 * hovering/tapping the back card pushes every card in front of it down & right,
 * revealing the ones behind — like reading a transparent blockchain ledger.
 * The three original (back/middle/front) rules are preserved verbatim.
 */
const getCardSpread = (focusedIndex: number, index: number) => {
  if (focusedIndex >= index) return "";
  // back card (0) focused
  if (focusedIndex === 0 && index === 1) return " !translate-y-20 sm:!translate-y-32 !translate-x-12 sm:!translate-x-24";
  if (focusedIndex === 0 && index === 2) return " !translate-y-28 sm:!translate-y-44 !translate-x-24 sm:!translate-x-40";
  if (focusedIndex === 0 && index === 3) return " !translate-y-36 sm:!translate-y-56 !translate-x-32 sm:!translate-x-56";
  // middle card (1) focused
  if (focusedIndex === 1 && index === 2) return " !translate-y-24 sm:!translate-y-40 !translate-x-24 sm:!translate-x-40";
  if (focusedIndex === 1 && index === 3) return " !translate-y-32 sm:!translate-y-52 !translate-x-32 sm:!translate-x-56";
  // second-front card (2) focused
  if (focusedIndex === 2 && index === 3) return " !translate-y-28 sm:!translate-y-44 !translate-x-24 sm:!translate-x-40";
  return "";
};

/**
 * Default resting pose: cards stay fanned out to the side (diagonal 3D stack),
 * always peeking at each other without needing a hover.
 */
const getDefaultSpread = (index: number) => {
  if (index <= 0) return "";
  if (index === 1) return " !translate-x-12 sm:!translate-x-24 !translate-y-8 sm:!translate-y-14";
  if (index === 2) return " !translate-x-24 sm:!translate-x-40 !translate-y-14 sm:!translate-y-24";
  return " !translate-x-32 sm:!translate-x-52 !translate-y-20 sm:!translate-y-32";
};

export default function Testimonials({ cards, onSelect, onPreviewChange }: TestimonialsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const getCardClassName = (index: number, baseClassName: string) => {
    // Default: always fanned to the side for a 3D look.
    // When hovering/active, cards spread even further like a transparent ledger.
    const focusedIndex = hoveredIndex ?? activeIndex;

    if (focusedIndex === null) return baseClassName + getDefaultSpread(index);
    return baseClassName + getCardSpread(focusedIndex, index);
  };

  const handleTap = (index: number) => {
    onPreviewChange?.(index);
    if (activeIndex === index) {
      // Already active, will navigate/select on next tap
      return;
    }
    setActiveIndex(index);
  };

  const defaultCards: TestimonialCardProps[] = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-2xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      username: "Sarah Chen",
      handle: "@sarahchen",
      content: "This component is exactly what I needed for my landing page. The stacked effect is beautiful! 🎨",
      date: "Jan 3, 2026",
      verified: true,
      likes: 42,
      retweets: 8,
      tweetUrl: "https://x.com",
    },
    {
      className:
        "[grid-area:stack] translate-x-8 sm:translate-x-16 translate-y-6 sm:translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-2xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      username: "Mike Johnson",
      handle: "@mikej_dev",
      content: "The hover interactions are so smooth. Love how the cards spread apart to reveal the ones behind. Great UX thinking!",
      date: "Jan 2, 2026",
      verified: true,
      likes: 28,
      retweets: 5,
      tweetUrl: "https://x.com",
    },
    {
      className: "[grid-area:stack] translate-x-16 sm:translate-x-32 translate-y-12 sm:translate-y-20 hover:translate-y-6 sm:hover:translate-y-10",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      username: "Alex Rivera",
      handle: "@alexrivera",
      content: "Finally a testimonial component that looks native to Twitter/X! Dark mode support is chef's kiss 👨‍🍳",
      date: "Jan 1, 2026",
      verified: true,
      likes: 156,
      retweets: 23,
      tweetUrl: "https://x.com",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <TestimonialCard
          key={index}
          {...cardProps}
          className={getCardClassName(index, cardProps.className || "")}
          onHover={() => {
            setHoveredIndex(index);
            onPreviewChange?.(index);
          }}
          onLeave={() => {
            setHoveredIndex(null);
            onPreviewChange?.(null);
          }}
          isActive={activeIndex === index}
          onTap={() => handleTap(index)}
          onSelect={onSelect ? () => onSelect(index) : undefined}
        />
      ))}
    </div>
  );
}

// Demo component for 21st.dev
function Component() {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center bg-background p-8">
      <Testimonials />
    </div>
  );
}

export { TestimonialCard, Testimonials, Component };
export type { TestimonialCardProps, TestimonialsProps };