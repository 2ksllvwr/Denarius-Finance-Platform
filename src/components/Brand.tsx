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
  return <span className={cn("font-semibold", className)}>DENARIUS</span>;
}
