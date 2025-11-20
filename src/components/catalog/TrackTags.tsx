import type { FC } from "react";

interface TagListProps {
  items: string[];
  variant?: "mood" | "use";
}

/**
 * Chips de tags inspirados en Supabase:
 * - Base clara, borde suave.
 * - Moods: acento verde.
 * - Uses: acento gris-azulado.
 */
export const TagList: FC<TagListProps> = ({ items, variant = "mood" }) => {
  if (!items || items.length === 0) return null;

  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-tight border";

  const moodClasses =
    "border-[#3ECF8E]/50 bg-[#3ECF8E]/5 text-slate-800"; // verde Supabase
  const useClasses =
    "border-slate-300 bg-slate-100 text-slate-700";

  const toneClasses = variant === "mood" ? moodClasses : useClasses;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`${baseClasses} ${toneClasses}`}>
          {item}
        </span>
      ))}
    </div>
  );
};
