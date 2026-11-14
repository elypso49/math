import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  /** Vertical gap between the blocks, in Tailwind spacing units. */
  gap?: 'tight' | 'normal' | 'loose';
  className?: string;
}

const GAPS = { tight: 'gap-5', normal: 'gap-6', loose: 'gap-7' };

/**
 * Page frame: phone-width column on the warm paper background.
 * @param props Content and spacing of the page.
 */
export function Screen({ children, gap = 'normal', className = '' }: ScreenProps) {
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper px-6 pt-12 pb-7 text-ink ${GAPS[gap]} ${className}`}
    >
      {children}
    </main>
  );
}

/** Pushes the following blocks to the bottom of the screen. */
export const Spacer = () => <div className="grow" />;
