import type { ReactNode, MouseEvent } from "react";

type ButtonProps = {
  children?: ReactNode;
  onClick?: (e?: MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export const Button = ({
  children,
  onClick,
  className = "",
  disabled,
  title,
}: ButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 flex justify-center items-center gap-1 transition-colors rounded-lg hover:bg-gray-800 ${className}`}
  >
    {children ?? children}
  </button>
);
