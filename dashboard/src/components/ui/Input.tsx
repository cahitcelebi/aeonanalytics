import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={
        "block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700/50 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm " +
        className
      }
      {...props}
    />
  )
);
Input.displayName = "Input";

export default Input; 