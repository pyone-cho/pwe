import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    orgSlug: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('Network Error')
          ? 'Cannot connect to server. Please try again later.'
          : err instanceof Error
            ? err.message
            : 'Registration failed';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">PWE</h1>
          <p className="text-gray-500 mt-2">Join your organization</p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Organization Slug"
                placeholder="eventhub"
                value={form.orgSlug}
                onChange={(e) => setForm({ ...form, orgSlug: e.target.value })}
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
                />
              </div>
              <Input
                label="Phone"
                placeholder="+95 9 123 456 789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
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
                Register
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
