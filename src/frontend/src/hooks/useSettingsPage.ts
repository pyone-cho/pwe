import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getOrganization, updateOrganization } from '@/services/organization';
import type { Organization } from '@/types';

interface SettingsFormState {
  name: string;
  description: string;
  phone: string;
}

export function useSettingsPage() {
  const { toast } = useToast();
  const { organization: orgFromAuth } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<SettingsFormState>({ name: '', description: '', phone: '' });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    void getOrganization()
      .then((res) => {
        setOrg(res.organization);
        setForm({
          name: res.organization.name,
          description: res.organization.description || '',
          phone: res.organization.phone || '',
        });
      })
      .catch(() => {
        if (orgFromAuth) {
          setForm({ name: orgFromAuth.name, description: '', phone: '' });
        }
      })
      .finally(() => setIsLoading(false));
  }, [orgFromAuth]);

  const validatePhone = useCallback((value: string): boolean => {
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
  }, []);

  const handleSave = useCallback(async (e: FormEvent) => {
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
  }, [form, toast, validatePhone]);

  return {
    org,
    isLoading,
    isSaving,
    form,
    setForm,
    phoneError,
    validatePhone,
    handleSave,
  };
}
