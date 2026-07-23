import React from "react";

interface KnightIconProps {
  className?: string;
}

export function KnightIcon({ className }: KnightIconProps) {
  return (
    <img
      src="/knight.png"
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
