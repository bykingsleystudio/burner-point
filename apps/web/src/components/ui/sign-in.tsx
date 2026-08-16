'use client';

import type { ReactNode } from 'react';
import { AuthShell } from '@/components/ui/auth-shell';
import { cn } from '@/lib/utils';

interface SignInPageProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  footerContent?: ReactNode;
  socialAuth?: ReactNode;
  chips?: string[];
  dividerLabel?: string;
  asideTitle?: string;
  asideDescription?: string;
  helperContent?: ReactNode;
}

export const GlassInputWrapper = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn('bp-auth-input-shell', className)}>
    {children}
  </div>
);

export const AuthDivider = ({ label }: { label: string }) => (
  <div className="bp-auth-divider" aria-hidden="true">
    <span>{label}</span>
  </div>
);

export const SignInPage = ({
  title = 'Sign in to Burner Point',
  description,
  children,
  footerContent,
  socialAuth,
  chips,
  dividerLabel = 'or',
  asideTitle,
  asideDescription,
  helperContent,
}: SignInPageProps) => {
  return (
    <AuthShell
      title={title}
      description={description || 'Access your private Burner Point account.'}
      asideTitle={asideTitle}
      asideDescription={asideDescription}
      helperContent={helperContent}
    >
      <div className="flex flex-col gap-5">
        {chips?.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <span key={chip} className="bp-auth-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {socialAuth ? <div className="flex flex-col gap-3">{socialAuth}</div> : null}
        {socialAuth ? <AuthDivider label={dividerLabel} /> : null}

        <div className="flex flex-col gap-4">{children}</div>

        {footerContent ? <div className="bp-auth-card-footer">{footerContent}</div> : null}
      </div>
    </AuthShell>
  );
};
