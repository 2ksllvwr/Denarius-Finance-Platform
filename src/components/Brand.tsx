import { cn } from "@/utils/cn";

interface BrandMarkProps {
  className?: string;
  letterClassName?: string;
}

const romanDStyle = {
  fontFamily: "Georgia, \"Times New Roman\", serif",
  fontWeight: 500,
};

export function BrandMark({ className, letterClassName }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center justify-center font-bold select-none", className)}>
      <span className={cn("leading-none", letterClassName)} style={romanDStyle}>D</span>
    </div>
  );
}

export function BrandName({ className }: { className?: string }) {
  return (
    <span
      aria-label="Denarius"
      className={cn("inline-flex items-baseline leading-none tracking-normal select-none", className)}
    >
      <span className="font-bold" style={romanDStyle}>D</span>
      <span className="font-brand font-normal lowercase">enarius</span>
    </span>
  );
}
