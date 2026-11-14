import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface NoticeProps {
  icon?: IconName;
  children: ReactNode;
}

/**
 * Sand-coloured information box.
 * @param props Leading icon and message.
 */
export function Notice({ icon = 'info', children }: NoticeProps) {
  return (
    <div className="flex gap-3 rounded-[18px] bg-sand p-4 text-[15px] leading-normal">
      <Icon name={icon} size={20} className="mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

/**
 * Red error message, announced to screen readers.
 * @param props The message, nothing rendered when empty.
 */
export const ErrorText = ({ children }: { children?: string | null }) =>
  children ? (
    <p role="alert" className="m-0 text-center text-[15px] font-bold text-danger">
      {children}
    </p>
  ) : null;
