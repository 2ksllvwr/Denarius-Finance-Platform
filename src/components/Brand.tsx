import { cn } from "@/utils/cn";

interface BrandMarkProps {
  className?: string;
  letterClassName?: string;
}

const romanDStyle = {
  fontFamily: "\"DenariusDisplay\", Georgia, serif",
  fontWeight: 400,
};

const brandFixStyle = {
  fontFamily: "Georgia, \"Times New Roman\", serif",
  fontWeight: 700,
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
      className={cn("font-brand inline-flex items-baseline leading-none tracking-normal select-none", className)}
    >
      <span>Dena</span>
      <span className="inline-block translate-y-[-0.01em] scale-x-[0.88] scale-y-[0.92]" style={brandFixStyle}>r</span>
      <span>ius</span>
    </span>
  );
}

export function SidebarBrandName({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <span
      aria-label="Denarius"
      className={cn(
        "inline-flex items-baseline overflow-hidden leading-none text-white select-none transition-[width] duration-300 ease-out",
        collapsed ? "w-11 justify-center" : "w-[188px] justify-start",
        className,
      )}
    >
      <span className={cn(
        "font-brand leading-none transition-transform duration-300 ease-out",
        collapsed ? "translate-x-[3px] text-[34px]" : "translate-x-0 text-[36px]",
      )}>D</span>
      <span className={cn(
        "font-brand text-[36px] leading-none transition-[max-width,opacity,transform] duration-300 ease-out",
        collapsed ? "max-w-0 translate-x-[-8px] opacity-0" : "max-w-[160px] translate-x-0 opacity-100",
      )}>
        <span>ena</span>
        <span className="inline-block translate-y-[-0.01em] scale-x-[0.88] scale-y-[0.92]" style={brandFixStyle}>r</span>
        <span>ius</span>
      </span>
    </span>
  );
}
