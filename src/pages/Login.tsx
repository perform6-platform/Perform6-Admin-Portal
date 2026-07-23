import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Cloud,
  Eye,
  EyeOff,
  LineChart,
  Lock,
  Mail,
  Monitor,
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useLogin } from '../hooks/useLogin';
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

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { mutate: login, isPending } = useLogin({
    rememberMe,
    onSuccess: (message) => {
      showToast({
        title: message,
        variant: 'success',
      });
      navigate('/');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(
      { email, password },
      {
        onError: (error) => {
          showToast({
            title: getApiErrorMessage(error, 'Invalid email or password'),
            variant: 'error',
          });
        },
      },
    );
  }

  return (
    <div className="login-page flex min-h-screen bg-white text-p6-gray-950">
      {/* Left marketing panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/55 to-brand-900/15" />

        <div className="relative flex h-full min-h-screen flex-col p-10 xl:p-14">
          <div className="flex flex-1 items-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold leading-tight text-white">
                Smart Fitness.
              </h1>
              <p className="mt-1 text-4xl font-bold leading-tight text-brand-400">
                Seamless Management.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-white/75">
                Perform6 is an interactive touchscreen fitness platform built for reliability,
                offline performance and centralized control.
              </p>

              <ul className="mt-8 space-y-5">
                {FEATURES.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-400/40 bg-brand-500/15 text-brand-300">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/60">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="shrink-0 text-xs text-white/45">© 2024 Perform6. All rights reserved.</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-p6-gray-950">Welcome Back!</h2>
            <p className="mt-2 text-sm text-p6-gray-600">
              Sign in to access your Perform6 admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-p6-gray-900">Email Address</label>
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

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-p6-gray-900">Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" strokeWidth={1.75} />}
                className="login-field [&_input]:h-11"
                endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-p6-gray-400 transition-colors hover:text-p6-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
                }
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-p6-gray-300 text-brand-600 focus:ring-brand-500/30"
                />
                <span className="text-sm text-p6-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={isPending}
            >
              {isPending ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-p6-gray-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-medium text-brand-600 transition-colors hover:text-brand-500"
            >
              Contact your system administrator.
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
