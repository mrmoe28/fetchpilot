interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
}

export default function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    secondary: 'bg-slate-100 text-slate-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700'
  };
  
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium';
  const variantClass = variantStyles[variant];
  
  return (
    <span className={`${baseClasses} ${variantClass} ${className || ''}`}>
      {children}
    </span>
  );
}
