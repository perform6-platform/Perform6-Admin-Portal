import type { ReactNode } from 'react';
import { Mail, Shield, User } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { formatUserRole } from '../lib/formatUserRole';
import { getApiErrorMessage } from '../services/axios';
import { Badge, Card, CardContent, CardHeader, CardTitle, PageShell } from '../components/ui';

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-surface-border bg-surface-muted/40 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption text-content-muted">{label}</p>
        <p className="mt-0.5 break-all text-body-sm text-content-primary">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { data: user, isLoading, isError, error } = useCurrentUser();

  if (isLoading && !user) {
    return (
      <PageShell title="Profile">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-surface-muted" />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (isError || !user) {
    return (
      <PageShell title="Profile">
        <Card>
          <CardContent className="p-6">
            <p className="text-body-sm text-status-danger">
              {getApiErrorMessage(error, 'Failed to load profile')}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageShell title="Profile">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-medium text-brand-600 dark:bg-brand-600/20 dark:text-brand-400">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-content-primary">{user.name}</p>
              <Badge variant="brand" className="mt-1">
                {formatUserRole(user.role)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField icon={<User className="h-4 w-4" />} label="Full Name" value={user.name} />
            <ProfileField icon={<Mail className="h-4 w-4" />} label="Email Address" value={user.email} />
            <ProfileField
              icon={<Shield className="h-4 w-4" />}
              label="Role"
              value={formatUserRole(user.role)}
            />
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
