import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { generateSlug } from '@/lib/utils';

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    orgName: '',
    slug: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleNameChange = (value: string) => {
    setForm({ ...form, orgName: value, slug: generateSlug(value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('Network Error')
          ? 'Cannot connect to server. Please try again later.'
          : err instanceof Error
            ? err.message
            : 'Signup failed';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white relative">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-500 items-center justify-center p-12">
        <div className="relative z-10 max-w-md text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-3xl font-bold">PWE</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Create your<br />
            <span className="text-blue-100">organization</span>
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed">
            Set up your workspace in minutes. Invite your team, start managing members, and host events.
          </p>

          {/* Steps */}
          <div className="mt-10 space-y-4">
            {[
              { step: '1', title: 'Create organization', desc: 'Set up your workspace' },
              { step: '2', title: 'Add members', desc: 'Import or invite your team' },
              { step: '3', title: 'Host events', desc: 'Create and manage events' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-sm font-bold">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-blue-100/70">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md relative animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">PWE</span>
            </Link>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your organization</h1>
            <p className="text-gray-500 mt-1">Set up your workspace in minutes</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Org Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Yangon Sports Club"
                    value={form.orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Workspace Slug</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-medium">#</span>
                  </div>
                  <input
                    type="text"
                    placeholder="yangon-sports"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    placeholder="Ko"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    placeholder="Thant"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20  transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Create Organization
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an organization?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
