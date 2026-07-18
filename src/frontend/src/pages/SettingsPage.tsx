import { useState, useEffect } from 'react';
import { getOrganization, updateOrganization } from '@/services/organization';
import { Button, Input, Textarea, Card, CardContent, Spinner, PageHeader, Section } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { Organization } from '@/types';

export default function SettingsPage() {
  const { toast } = useToast();
  const { organization: orgFromAuth } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
  });

  useEffect(() => {
    getOrganization()
      .then((res) => {
        setOrg(res.organization);
        setForm({
          name: res.organization.name,
          description: res.organization.description || '',
          phone: res.organization.phone || '',
        });
      })
      .catch(() => {
        // Fallback to auth-stored org
        if (orgFromAuth) {
          setForm({ name: orgFromAuth.name, description: '', phone: '' });
        }
      })
      .finally(() => setIsLoading(false));
  }, [orgFromAuth]);

  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (value: string): boolean => {
    if (!value) {
      setPhoneError('');
      return true;
    }
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    if (!phoneRegex.test(value)) {
      setPhoneError('Phone must contain only numbers and symbols (+, -, (, ))');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(form.phone)) return;
    setIsSaving(true);
    try {
      await updateOrganization(form);
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Spinner size="lg" className="mt-12" />;

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization's profile and preferences"
      />

      <Section>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Organization Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              validatePhone(e.target.value);
            }}
            pattern="[+]?[\d\s\-()]+"
            title="Phone must contain only numbers and symbols (+, -, (, ))"
          />
          {phoneError && (
            <p className="text-sm text-red-500">{phoneError}</p>
          )}

          {org && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{org.slug}</code>
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
