"use client";

import Star from "@/public/star-icon";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export function StarRating({ rating, size = 16, color }: StarRatingProps) {
  const scaledRating = rating / 2;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index + 1 <= Math.round(scaledRating);

        return (
          <Star
            key={index}
            isFilled={isFilled}
            size={size}
            color={color}
            className="flex items-center"
          />
        );
      })}
    </div>
  );
}
