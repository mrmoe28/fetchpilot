import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variantClasses = {
      default: "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 focus:ring-sky-500",
      outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-slate-500",
      ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-slate-500",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-slate-500",
      destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    };

    const sizeClasses = {
      default: "px-6 py-3",
      sm: "px-4 py-2 text-sm",
      lg: "px-8 py-4 text-lg",
      icon: "w-10 h-10 p-0",
    };

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, type ButtonProps };

export default Button;
