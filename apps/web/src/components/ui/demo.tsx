import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export default function LiquidGlassButtonDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-8">
        <LiquidGlassButton label="Get Started" size="sm" />
        <LiquidGlassButton label="Get Started" size="lg" />
      </div>
    </div>
  );
}