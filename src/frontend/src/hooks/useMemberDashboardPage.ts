import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/services/auth';
import { listAnnouncements } from '@/services/announcements';
import { listEvents } from '@/services/events';
import { getMyMember, updateMyProfile } from '@/services/members';
import type { Announcement, Event, Member } from '@/types';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  emergencyContact: string;
  notes: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useMemberDashboardPage() {
  const { user, organization } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      getMyMember().catch(() => null),
      listEvents({ limit: 5, sort: 'startDate', order: 'asc' }).catch(() => null),
      listAnnouncements({ status: 'published', limit: 5 }).catch(() => null),
    ]).then(([memberData, evts, anns]) => {
      setMember(memberData);
      setEvents(evts?.data || []);
      setAnnouncements(anns?.data || []);
      setIsLoading(false);
    });
  }, []);

  const openEditModal = useCallback(() => {
    if (member) {
      setEditForm({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        phone: member.phone || '',
        email: member.email || '',
        emergencyContact: member.emergencyContact || '',
        notes: member.notes || '',
      });
      setEditErrors({});
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setIsEditOpen(true);
    }
  }, [member]);

  const handleEditSave = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!editForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!editForm.phone.trim()) errors.phone = 'Phone is required';
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsEditSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        emergencyContact: editForm.emergencyContact.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setMember(updated);
      setIsEditOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile';
      setEditErrors({ general: msg });
    } finally {
      setIsEditSaving(false);
    }
  }, [editForm]);

  const handlePasswordChange = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password';
      setPasswordErrors({ general: msg });
    } finally {
      setIsPasswordSaving(false);
    }
  }, [passwordForm]);

  const firstName = user?.profile?.firstName || 'there';

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });
  }, [announcements]);

  return {
    member,
    events,
    announcements: sortedAnnouncements,
    isLoading,
    expandedAnnouncement,
    setExpandedAnnouncement,
    isEditOpen,
    setIsEditOpen,
    editForm,
    setEditForm,
    editErrors,
    isEditSaving,
    passwordForm,
    setPasswordForm,
    passwordErrors,
    isPasswordSaving,
    openEditModal,
    handleEditSave,
    handlePasswordChange,
    organization,
    firstName,
  };
}
