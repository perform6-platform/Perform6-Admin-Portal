import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Cloud, LineChart, Mail, Monitor } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { forgotPasswordRequest } from '../services/auth.api';
import { getApiErrorMessage } from '../services/axios';
import loginBg from '../assets/login-bg.png';

const FEATURES = [
  {
    icon: Monitor,
    title: 'Centralized Control',
    description: 'Manage all your BrightSign devices from one powerful dashboard.',
  },
  {
    icon: Cloud,
    title: 'Offline First',
    description: 'Reliable playback and content delivery even without an internet connection.',
  },
  {
    icon: LineChart,
    title: 'Powerful Analytics',
    description: 'Real-time insights and reports to optimize performance.',
  },
] as const;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: sendResetLink, isPending } = useMutation({
    mutationFn: () => forgotPasswordRequest(email),
    onSuccess: (result) => {
      setSubmitted(true);
      showToast({ title: result.message, variant: 'success' });
    },
    onError: (error) => {
      showToast({
        title: getApiErrorMessage(error, 'Something went wrong. Please try again.'),
        variant: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendResetLink();
  }

  return (
    <div className="login-page flex min-h-screen bg-white text-p6-gray-950">
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/55 to-brand-900/15" />

        <div className="relative flex h-full min-h-screen flex-col p-8 xl:p-16">
          <div className="flex flex-1 items-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold leading-tight text-white">
                Smart Fitness.
              </h1>
              <p className="mt-1 text-4xl font-bold leading-tight text-white">
                Seamless Management.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                Perform6 is an interactive touchscreen fitness platform built for reliability,
                offline performance and centralized control.
              </p>

              <ul className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-400/40 bg-brand-500/15 text-brand-300">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{title}</p>
                      <p className="mt-0 text-xs leading-relaxed text-white/60">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="shrink-0 text-xs text-white/45">© 2024 Perform6. All rights reserved.</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-8 sm:px-8 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          {!submitted ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-p6-gray-950">Forgot Password?</h2>
                <p className="mt-2 text-sm text-p6-gray-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-p6-gray-900">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
                    className="login-field [&_input]:h-11"
                    required
                  />
                </div>

                <Button type="submit" fullWidth size="lg" disabled={isPending}>
                  {isPending ? 'Sending...' : 'Send Reset Link'}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10">
                <Mail className="h-8 w-8 text-brand-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold text-p6-gray-950">Check Your Email</h2>
              <p className="mt-3 text-sm leading-relaxed text-p6-gray-600">
                We&apos;ve sent a password reset link to <strong className="text-p6-gray-950">{email}</strong>.
                Please check your inbox and click the link to reset your password.
              </p>
              <p className="mt-2 text-xs text-p6-gray-400">
                The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-500"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
