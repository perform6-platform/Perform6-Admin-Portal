import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from './cardStyles';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(CARD_SURFACE_CLASS, paddingMap[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-content-primary', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function EmptyState({
  message = 'No data available',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-surface-border p-8 text-center text-content-muted shadow-card sm:p-12',
        className,
      )}
      {...props}
    >
      {message}
    </div>
  );
}

export interface PageShellProps {
  title: string;
  children: ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle>{title}</PageTitle>
      {children}
    </div>
  );
}

export function PageTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn('shrink-0 text-xl font-bold tracking-tight text-content-primary sm:text-2xl', className)}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionLabel({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-section-label uppercase text-content-secondary', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function BodyText({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-body-sm text-content-secondary', className)} {...props}>
      {children}
    </p>
  );
}

export function Caption({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('text-caption text-content-muted', className)} {...props}>
      {children}
    </span>
  );
}
