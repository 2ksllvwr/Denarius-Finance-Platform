import type { User } from "@/data/types";
import { cn } from "@/utils/cn";

interface ProfileAvatarProps {
  user: Pick<User, "name" | "avatarUrl">;
  className?: string;
  textClassName?: string;
}

export function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

export function ProfileAvatar({ user, className, textClassName }: ProfileAvatarProps) {
  return (
    <div className={cn("relative overflow-hidden bg-gray-900 flex items-center justify-center text-white font-semibold select-none", className)}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className={cn("leading-none", textClassName)}>{getInitials(user.name)}</span>
      )}
    </div>
  );
}
