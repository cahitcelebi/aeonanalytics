'use client';

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={
        `px-4 py-2 rounded-md font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ` +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
} 