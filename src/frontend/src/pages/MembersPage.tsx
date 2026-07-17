import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { listMembers, createMember, updateMember, updateMemberStatus } from '@/services/members';
import { Button, Input, Select, Modal, Badge, Pagination, EmptyState, Card, PageHeader, Section } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/lib/utils';
import type { Member, MembershipStatus, MembershipType } from '@/types';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export default function MembersPage() {
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    membershipType: '',
    emergencyContact: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateMember = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const extractBackendErrors = (err: unknown): string => {
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
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const fetchMembers = async () => {
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
  };

  useEffect(() => {
    fetchMembers();
  }, [page, statusFilter, search, searchTrigger]);

  const handleSearch = () => {
    goToPage(1);
    setSearchTrigger((t) => t + 1);
  };

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', phone: '', email: '', membershipType: '', emergencyContact: '', notes: '' });
    setEditingMember(null);
    setFieldErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMember()) return;
    try {
      await createMember(form);
      toast('Member created', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchMembers();
    } catch (err: unknown) {
      toast(extractBackendErrors(err), 'error');
    }
  };

  const handleEdit = (member: Member) => {
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
  };

  const handleUpdate = async (e: React.FormEvent) => {
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
      fetchMembers();
    } catch (err: unknown) {
      toast(extractBackendErrors(err), 'error');
    }
  };

  const handleStatusToggle = async (member: Member) => {
    const newStatus: MembershipStatus =
      member.membershipStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateMemberStatus(member.id, newStatus);
      toast(`Member ${newStatus}`, 'success');
      fetchMembers();
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Members"
        description="Manage your organization's members"
        actions={
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + Add Member
          </Button>
        }
      />

      <Section>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select
            options={statusOptions}
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40"
          />
          <Button variant="secondary" onClick={handleSearch}>Search</Button>
        </div>
      </Section>

      <Section>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
                <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/4 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/6 animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState title="No members found" description="Add your first member to get started" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                            {m.firstName[0]}{m.lastName[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {m.firstName} {m.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.email || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="status" value={m.membershipStatus}>{m.membershipStatus}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(m.joinDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(m)}>
                            {m.membershipStatus === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={goToPage} />}
          </>
        )}
      </Section>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title={editingMember ? 'Edit Member' : 'Add Member'}
      >
        <form onSubmit={editingMember ? handleUpdate : handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => { setForm({ ...form, firstName: e.target.value }); clearFieldError('firstName'); }}
              error={fieldErrors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => { setForm({ ...form, lastName: e.target.value }); clearFieldError('lastName'); }}
              error={fieldErrors.lastName}
              required
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearFieldError('phone'); }}
            error={fieldErrors.phone}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); clearFieldError('email'); }}
            error={fieldErrors.email}
          />
          <Select
            label="Membership Type"
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'student', label: 'Student' },
              { value: 'honorary', label: 'Honorary' },
              { value: 'lifetime', label: 'Lifetime' },
            ]}
            placeholder="Select type"
            value={form.membershipType}
            onChange={(e) => setForm({ ...form, membershipType: e.target.value })}
          />
          <Input
            label="Emergency Contact"
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">{editingMember ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
