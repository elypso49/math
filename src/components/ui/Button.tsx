import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Look of an action. */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'dark' | 'dashed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark h-[62px] rounded-[18px] text-xl',
  secondary: 'bg-key text-ink h-14 rounded-2xl text-[17px]',
  outline: 'bg-white text-ink border-2 border-line h-10 rounded-xl px-3.5 text-sm',
  dark: 'bg-ink text-white h-11 rounded-full px-3.5 text-[15px]',
  dashed: 'bg-transparent text-ink border-2 border-dashed border-stitch h-[52px] rounded-2xl text-base',
};

const base = 'inline-flex items-center justify-center gap-2.5 font-bold no-underline transition-colors disabled:opacity-50';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * Action button in one of the app's styles.
 * @param props Variant plus the native button attributes.
 */
export function Button({ variant = 'primary', className = '', type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={`${base} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

/**
 * Navigation link styled as a button.
 * @param props Destination, variant and content.
 */
export function LinkButton({ to, variant = 'primary', className = '', children }: LinkButtonProps) {
  return (
    <Link to={to} className={`${base} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
