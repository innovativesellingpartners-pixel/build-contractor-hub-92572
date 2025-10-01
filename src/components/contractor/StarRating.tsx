import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  level: number;
  maxStars?: number;
}

export function StarRating({ level, maxStars = 5 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-5 w-5",
            index < level 
              ? "fill-red-500 text-red-500" 
              : "fill-red-100 text-red-300"
          )}
        />
      ))}
    </div>
  );
}
