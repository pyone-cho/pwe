import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { generateSlug } from '@/lib/utils';

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">PWE</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your organization</h1>
          <p className="text-gray-500 mt-1">Set up your workspace in minutes</p>
        </div>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Organization Name"
                placeholder="Yangon Sports Club"
                value={form.orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <Input
                label="Slug"
                placeholder="yangon-sports"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Ko"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Thant"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Create Organization
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an organization?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
