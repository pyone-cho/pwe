import { Button, Input, Textarea, Spinner, PageHeader, Section } from '@/components/ui';
import { useSettingsPage } from '@/hooks/useSettingsPage';

export default function SettingsPage() {
  const {
    org,
    isLoading,
    isSaving,
    form,
    setForm,
    phoneError,
    validatePhone,
    handleSave,
  } = useSettingsPage();

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
