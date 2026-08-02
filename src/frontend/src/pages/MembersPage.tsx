import { Button, Input, Select, Modal, Badge, Pagination, EmptyState, PageHeader, Section } from '@/components/ui';
import { useMembersPage } from '@/hooks/useMembersPage';

export default function MembersPage() {
  const {
    members,
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
    meta,
    goToPage,
  } = useMembersPage();

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
                      <td className="px-6 py-4 text-sm text-gray-600">{m.joinedLabel}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => { setResetModalMember(m); setResetPassword(null); }}>
                            Reset Password
                          </Button>
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

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalMember}
        onClose={() => { setResetModalMember(null); setResetPassword(null); }}
        title="Reset Password"
        size="sm"
      >
        {resetPassword ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Password has been reset for <strong>{resetModalMember?.firstName} {resetModalMember?.lastName}</strong>.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Temporary Password</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetPassword}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(resetPassword);
                    toast('Copied to clipboard', 'success');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Share this password with the member. They will be forced to re-login.
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={() => { setResetModalMember(null); setResetPassword(null); }}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a new temporary password for <strong>{resetModalMember?.firstName} {resetModalMember?.lastName}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              Their current password will stop working and they will be forced to re-login.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setResetModalMember(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleResetPassword} disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
