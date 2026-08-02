import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/lib/utils';
import {
  createMember,
  listMembers,
  resetMemberPassword,
  updateMember,
  updateMemberStatus,
} from '@/services/members';
import type { Member, MembershipStatus, MembershipType } from '@/types';

interface MemberFormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  membershipType: string;
  emergencyContact: string;
  notes: string;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const emptyForm: MemberFormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  membershipType: '',
  emergencyContact: '',
  notes: '',
};

export function useMembersPage() {
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetModalMember, setResetModalMember] = useState<Member | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const validateMember = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const extractBackendErrors = useCallback((err: unknown): string => {
    if (isAxiosError(err) && err.response?.data) {
      const data = err.response.data as { error?: string; details?: { field: string; message: string }[] };
      if (data.details && Array.isArray(data.details)) {
        const errors: Record<string, string> = {};
        data.details.forEach((d) => {
          const field = d.field.replace('body.', '');
          errors[field] = d.message;
        });
        setFieldErrors(errors);
        return 'Please fix the form errors below';
      }
      if (data.error) return data.error;
    }
    return 'An unexpected error occurred';
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listMembers({
        page,
        limit,
        search: search || undefined,
        status: (statusFilter as MembershipStatus) || undefined,
      });
      setMembers(res.data);
      setMeta(res.meta);
    } catch {
      toast('Failed to load members', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, setMeta, statusFilter, toast]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers, searchTrigger]);

  const handleSearch = useCallback(() => {
    goToPage(1);
    setSearchTrigger((t) => t + 1);
  }, [goToPage]);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingMember(null);
    setFieldErrors({});
  }, []);

  const handleCreate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!validateMember()) return;
    try {
      await createMember(form);
      toast('Member created', 'success');
      setShowCreateModal(false);
      resetForm();
      void fetchMembers();
    } catch (err: unknown) {
      toast(extractBackendErrors(err), 'error');
    }
  }, [extractBackendErrors, fetchMembers, form, resetForm, toast, validateMember]);

  const handleEdit = useCallback((member: Member) => {
    setEditingMember(member);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      email: member.email || '',
      membershipType: member.membershipType || '',
      emergencyContact: member.emergencyContact || '',
      notes: member.notes || '',
    });
    setFieldErrors({});
    setShowCreateModal(true);
  }, []);

  const handleUpdate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!validateMember()) return;
    try {
      await updateMember(editingMember.id, {
        ...form,
        membershipType: (form.membershipType || undefined) as MembershipType | undefined,
      });
      toast('Member updated', 'success');
      setShowCreateModal(false);
      resetForm();
      void fetchMembers();
    } catch (err: unknown) {
      toast(extractBackendErrors(err), 'error');
    }
  }, [editingMember, extractBackendErrors, fetchMembers, form, resetForm, toast, validateMember]);

  const handleStatusToggle = useCallback(async (member: Member) => {
    const newStatus: MembershipStatus = member.membershipStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateMemberStatus(member.id, newStatus);
      toast(`Member ${newStatus}`, 'success');
      void fetchMembers();
    } catch {
      toast('Failed to update status', 'error');
    }
  }, [fetchMembers, toast]);

  const handleResetPassword = useCallback(async () => {
    if (!resetModalMember) return;
    setIsResetting(true);
    try {
      const password = await resetMemberPassword(resetModalMember.id);
      setResetPassword(password);
    } catch {
      toast('Failed to reset password', 'error');
      setResetModalMember(null);
    } finally {
      setIsResetting(false);
    }
  }, [resetModalMember, toast]);

  const formattedMembers = useMemo(() => members.map((member) => ({ ...member, joinedLabel: formatDate(member.joinDate) })), [members]);

  return {
    members: formattedMembers,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    setShowCreateModal,
    editingMember,
    form,
    setForm,
    fieldErrors,
    clearFieldError,
    resetForm,
    handleSearch,
    handleCreate,
    handleEdit,
    handleUpdate,
    handleStatusToggle,
    handleResetPassword,
    resetModalMember,
    setResetModalMember,
    resetPassword,
    setResetPassword,
    isResetting,
    statusOptions,
    page,
    limit,
    meta,
    goToPage,
    formatDate,
  };
}
