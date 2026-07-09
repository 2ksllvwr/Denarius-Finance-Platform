import { cn } from "@/utils/cn";

interface BrandMarkProps {
  className?: string;
  letterClassName?: string;
}

const romanDStyle = {
  fontFamily: "\"DenariusDisplay\", Georgia, serif",
  fontWeight: 400,
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
      className={cn("font-brand inline-block leading-none tracking-normal select-none", className)}
    >
      Denarius
    </span>
  );
}

export function SidebarBrandName({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <span
      aria-label="Denarius"
      className={cn("inline-flex items-baseline overflow-hidden leading-none text-white select-none", className)}
    >
      <span className="font-brand text-[34px] leading-none">D</span>
      <span className={cn(
        "font-brand text-[38px] leading-none transition-[max-width,opacity,transform] duration-300 ease-out",
        collapsed ? "max-w-0 translate-x-[-4px] opacity-0" : "max-w-[180px] translate-x-0 opacity-100",
      )}>
        enarius
      </span>
    </span>
  );
}
