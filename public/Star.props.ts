import { HTMLAttributes } from "react";

export interface StarProps extends HTMLAttributes<HTMLSpanElement> {
  isFilled?: boolean;
  size?: number;
  color?: string;
}
