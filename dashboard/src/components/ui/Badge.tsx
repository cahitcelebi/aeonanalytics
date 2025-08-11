import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span className={
      "inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white " + className
    }>
      {children}
    </span>
  );
} 