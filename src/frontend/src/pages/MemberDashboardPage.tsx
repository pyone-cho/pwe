import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Section, EmptyState, Badge, Modal, Input, Button } from '@/components/ui';
import { getMyMember, updateMyProfile } from '@/services/members';
import { changePassword } from '@/services/auth';
import { listEvents } from '@/services/events';
import { listAnnouncements } from '@/services/announcements';
import { formatDate } from '@/lib/utils';
import type { Member, Event, Announcement } from '@/types';

export default function MemberDashboardPage() {
  const { user, organization } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);

  // Edit profile modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Password change modal state
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    Promise.all([
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

  const openEditModal = () => {
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
      setIsEditOpen(true);
    }
  };

  const handleEditSave = async () => {
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
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to update profile';
      setEditErrors({ general: msg });
    } finally {
      setIsEditSaving(false);
    }
  };

  const handlePasswordChange = async () => {
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
      setIsPasswordOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to change password';
      setPasswordErrors({ general: msg });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  const firstName = user?.profile?.firstName || 'there';

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const order = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome Hero */}
      <div className="rounded-xl bg-brand-500 p-6 sm:p-8 text-white">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${member?.membershipStatus === 'active' ? 'bg-green-300' : 'bg-gray-300'}`} />
              {member?.membershipStatus === 'active' ? 'Active Member' : member?.membershipStatus || 'Member'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-brand-100 text-sm sm:text-base">{organization?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-base">✅</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{member?.membershipStatus ?? 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <span className="text-base">🏷️</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{member?.membershipType ?? 'Regular'}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-base">📅</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Events</p>
              <p className="text-lg font-semibold text-gray-900">{events.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <span className="text-base">📢</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{announcements.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Info + Quick Actions */}
      {member && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section
            title="My Membership"
            description="Your membership details"
            className="lg:col-span-2"
            action={
              <Button variant="outline" size="sm" onClick={openEditModal}>
                Edit Profile
              </Button>
            }
          >
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-xl bg-brand-500 flex items-center justify-center text-lg font-semibold text-white shrink-0">
                {member.firstName?.[0]}{member.lastName?.[0] || ''}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <Badge variant="status" value={member.membershipStatus}>
                    {member.membershipStatus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{member.phone}</p>
                </div>
                {member.email && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(member.joinDate)}</p>
                </div>
                {member.membershipType && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Membership Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{member.membershipType}</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Quick Actions">
            <div className="space-y-2">
              <button
                onClick={openEditModal}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-base">✏️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Edit Profile</p>
                  <p className="text-xs text-gray-500">Update your personal information</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                  setIsPasswordOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-base">🔒</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </button>
              <Link
                to="/events"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-base">📅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Browse Events</p>
                  <p className="text-xs text-gray-500">Find and register for events</p>
                </div>
              </Link>
              <Link
                to="/announcements"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-base">📢</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Announcements</p>
                  <p className="text-xs text-gray-500">Stay updated with your org</p>
                </div>
              </Link>
            </div>
          </Section>
        </div>
      )}

      {/* Events + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Upcoming Events"
          description="Events you can register for"
          action={<Link to="/events" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>}
        >
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Check back later for new events."
              variant="info"
            />
          ) : (
            <div className="space-y-2">
              {events.map((e) => {
                const capacityPct = e.capacity ? Math.round((e.registeredCount / e.capacity) * 100) : null;
                return (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="block rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden group"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                            {e.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span>📅</span> {formatDate(e.startDate)}
                            </span>
                            {e.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <span>📍</span> {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="status" value="published">
                          {e.registeredCount}/{e.capacity || '∞'}
                        </Badge>
                      </div>
                      {capacityPct !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Capacity</span>
                            <span>{capacityPct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-orange-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${Math.min(capacityPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        <Section
          title="Announcements"
          description="Recent updates from your organization"
          action={<Link to="/announcements" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>}
        >
          {sortedAnnouncements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Updates from your organization will appear here."
              variant="empty"
            />
          ) : (
            <div className="space-y-2">
              {sortedAnnouncements.map((a) => {
                const isExpanded = expandedAnnouncement === a.id;
                const isUrgent = a.priority === 'urgent';
                return (
                  <div
                    key={a.id}
                    className={`rounded-lg border transition-colors overflow-hidden ${
                      isUrgent
                        ? 'border-red-200 bg-red-50 hover:border-red-300'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedAnnouncement(isExpanded ? null : a.id)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isUrgent && <span className="text-sm shrink-0">🔴</span>}
                          <Badge variant="status" value={a.priority}>
                            {a.priority}
                          </Badge>
                          <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                        </div>
                        <svg
                          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{a.content}</p>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          <span>By {a.authorName}</span>
                          <span>·</span>
                          <span>{formatDate(a.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile" size="md">
        <div className="space-y-4">
          {editErrors.general && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {editErrors.general}
            </div>
          )}
          <Input
            label="First Name"
            value={editForm.firstName}
            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            error={editErrors.firstName}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name"
            value={editForm.lastName}
            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            placeholder="Enter last name (optional)"
          />
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            error={editErrors.phone}
            placeholder="Enter phone number"
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            error={editErrors.email}
            placeholder="Enter email (optional)"
          />
          <Input
            label="Emergency Contact"
            value={editForm.emergencyContact}
            onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
            placeholder="Emergency contact name and phone"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:border-gray-300"
              placeholder="Additional notes (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave} isLoading={isEditSaving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} title="Change Password" size="sm">
        <div className="space-y-4">
          {passwordErrors.general && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {passwordErrors.general}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            error={passwordErrors.currentPassword}
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            error={passwordErrors.newPassword}
            placeholder="Enter new password (min 8 characters)"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            error={passwordErrors.confirmPassword}
            placeholder="Confirm new password"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePasswordChange} isLoading={isPasswordSaving}>Change Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
