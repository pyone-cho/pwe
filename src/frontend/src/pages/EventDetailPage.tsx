import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, updateEventStatus } from '@/services/events';
import { listRegistrations, cancelRegistration, registerForMember, getMyRegistration, cancelMyRegistration } from '@/services/registrations';
import { listAttendance, bulkCheckIn, undoCheckIn } from '@/services/attendance';
import { listPayments, getPaymentSummary } from '@/services/payments';
import { Button, Badge, Spinner, Card, CardContent, Input, PageHeader, Section, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatMMK } from '@/lib/utils';
import type { Event, Registration, AttendanceRecord, AttendanceStats, Payment, PaymentSummary } from '@/types';

type Tab = 'overview' | 'registrations' | 'attendance' | 'payments';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const canManageEvents = user?.role === 'admin' || user?.role === 'staff';

  // Registrations
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Attendance
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // Registration status for current member
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    if (!id) return;
    getEvent(id)
      .then((e) => { setEvent(e); setIsLoading(false); })
      .catch(() => { toast('Event not found', 'error'); setIsLoading(false); });

    // Check if current member is registered (for members only)
    if (!canManageEvents) {
      getMyRegistration(id)
        .then((reg) => setMyRegistration(reg))
        .catch(() => setMyRegistration(null));
    }
  }, [id, canManageEvents]);

  const loadTab = async (t: Tab) => {
    if (!id) return;
    setTab(t);
    setSearch('');
    setSelectedIds([]);
    try {
      if (t === 'registrations') {
        const res = await listRegistrations(id);
        setRegistrations(res.data);
      } else if (t === 'attendance') {
        const res = await listAttendance(id);
        setAttendance(res.data);
        setAttendanceStats(res.stats);
      } else if (t === 'payments') {
        const [payRes, sumRes] = await Promise.all([
          listPayments({ eventId: id }),
          getPaymentSummary(id),
        ]);
        setPayments(payRes.data);
        setPaymentSummary(sumRes);
      }
    } catch {
      toast('Failed to load data', 'error');
    }
  };

  const handleBulkCheckIn = async () => {
    if (!id || selectedIds.length === 0) return;
    try {
      await bulkCheckIn(id, { registrationIds: selectedIds });
      toast(`${selectedIds.length} checked in`, 'success');
      setSelectedIds([]);
      loadTab('attendance');
    } catch {
      toast('Bulk check-in failed', 'error');
    }
  };

  const handleUndo = async (attendanceId: string) => {
    try {
      await undoCheckIn(attendanceId);
      toast('Check-in undone', 'success');
      loadTab('attendance');
    } catch {
      toast('Failed to undo', 'error');
    }
  };

  const handleCancelReg = async (regId: string) => {
    try {
      await cancelRegistration(regId);
      toast('Registration cancelled', 'success');
      loadTab('registrations');
    } catch {
      toast('Failed to cancel', 'error');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await updateEventStatus(id, status);
      toast(`Event ${status}`, 'success');
      const updated = await getEvent(id);
      setEvent(updated);
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleRegister = async () => {
    if (!id) return;
    try {
      const reg = await registerForMember(id);
      toast('Successfully registered for event', 'success');
      setMyRegistration(reg);
      const updated = await getEvent(id);
      setEvent(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      toast(message, 'error');
    }
  };

  const handleCancelMyRegistration = async () => {
    if (!id) return;
    try {
      await cancelMyRegistration(id);
      toast('Registration cancelled', 'success');
      setMyRegistration(null);
      const updated = await getEvent(id);
      setEvent(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel registration';
      toast(message, 'error');
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        variant="error"
        title="Event not found"
        description="The event you're looking for may have been removed or is unavailable."
        action={<Link to="/events" className="text-sm font-medium text-indigo-600 hover:underline">Back to events</Link>}
      />
    );
  }

  const filteredRegistrations = registrations.filter((r) =>
    search ? (r.guestName || r.member?.firstName || '').toLowerCase().includes(search.toLowerCase()) : true
  );

  const filteredAttendance = attendance.filter((a) =>
    search ? a.memberName.toLowerCase().includes(search.toLowerCase()) : true
  );

  const capacityPct = event.capacity ? Math.round((event.registeredCount / event.capacity) * 100) : null;
  const isAlmostFull = capacityPct !== null && capacityPct >= 80;
  const isFull = capacityPct !== null && capacityPct >= 100;

  const tabs = canManageEvents ? ['overview', 'registrations', 'attendance', 'payments'] : ['overview'] as const;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      {/* Event Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="status" value={event.status}>{event.status}</Badge>
            {isFull && <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-100 text-xs font-semibold border border-red-400/30">Full</span>}
            {event.requiresPayment && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-medium border border-white/20">
                💰 {formatMMK(event.paymentAmount || 0)}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-brand-200/80">
            <span className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-white/10 flex items-center justify-center text-xs">📅</span>
              {formatDate(event.startDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-white/10 flex items-center justify-center text-xs">📍</span>
                {event.location}
              </span>
            )}
          </div>

          {/* Registration CTA for members */}
          {event.status === 'published' && !canManageEvents && (
            <div className="mt-5 pt-5 border-t border-white/10">
              {myRegistration ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-100 text-sm font-semibold border border-emerald-400/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    You're registered!
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelMyRegistration}
                    className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    Cancel Registration
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={isFull}
                  className="bg-white text-brand-700 hover:bg-brand-50 font-semibold shadow-glow hover:shadow-glow-lg"
                >
                  {isFull ? 'Event Full' : 'Register for Event'}
                </Button>
              )}
            </div>
          )}

          {/* Staff actions */}
          {canManageEvents && event.status === 'published' && (
            <div className="mt-5 pt-5 border-t border-white/10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('completed')}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                Complete
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel Event
              </Button>
            </div>
          )}
          {canManageEvents && event.status === 'draft' && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <Button
                onClick={() => handleStatusChange('published')}
                className="bg-white text-brand-700 hover:bg-brand-50 font-semibold"
              >
                Publish Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className={`grid gap-4 ${canManageEvents ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registered</p>
              <p className="text-xl font-bold text-gray-900">{event.registeredCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Capacity</p>
              <p className="text-xl font-bold text-gray-900">{event.capacity || '∞'}</p>
            </div>
          </CardContent>
        </Card>
        {canManageEvents && (
          <>
            <Card hover>
              <CardContent className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Checked In</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceStats?.checkedIn ?? '—'}</p>
                </div>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">
                    {paymentSummary ? formatMMK(paymentSummary.totalCollected) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Capacity Progress */}
      {capacityPct !== null && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Event Capacity</span>
              <span className={`font-semibold ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : 'text-brand-600'}`}>
                {event.registeredCount} / {event.capacity} ({capacityPct}%)
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isFull ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  isAlmostFull ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  'bg-gradient-to-r from-brand-500 to-violet-500'
                }`}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => loadTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-lg transition-all duration-200 ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <Section title="Event Details">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">About this event</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{event.description || 'No description provided.'}</p>
            </div>

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-sm">📅</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(event.startDate)}</p>
                  {event.endDate && (
                    <p className="text-xs text-gray-500 mt-0.5">to {formatDate(event.endDate)}</p>
                  )}
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="text-sm">📍</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Location</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{event.location}</p>
                  </div>
                </div>
              )}
              {event.requiresPayment && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <span className="text-sm">💰</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Payment</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{formatMMK(event.paymentAmount || 0)} MMK</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <span className="text-sm">🎫</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registration</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">{event.registrationMode}</p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {tab === 'registrations' && (
        <Section title="Registrations">
          <div className="px-6 py-3 border-b -mx-6 -mt-4 mb-4">
            <Input
              placeholder="Search registrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {r.type === 'member' ? `${r.member?.firstName} ${r.member?.lastName}` : r.guestName}
                    </td>
                    <td className="px-6 py-4"><Badge>{r.type}</Badge></td>
                    <td className="px-6 py-4"><Badge variant="status" value={r.status}>{r.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(r.registeredAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'registered' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancelReg(r.id)}>
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {tab === 'attendance' && (
        <Section title="Attendance">
          <div className="px-6 py-3 border-b -mx-6 -mt-4 mb-4 flex items-center justify-between gap-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {selectedIds.length > 0 && (
              <Button size="sm" onClick={handleBulkCheckIn}>
                Check In ({selectedIds.length})
              </Button>
            )}
          </div>
          {attendanceStats && (
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 -mx-6 mb-4 flex items-center gap-3">
              <div className="flex-1">
                <span className="font-medium">{attendanceStats.checkedIn}</span> / {attendanceStats.total} checked in
              </div>
              <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.total ? (attendanceStats.checkedIn / attendanceStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const unchecked = filteredAttendance
                            .filter((a) => !attendance.find((att) => att.registrationId === a.id))
                            .map((a) => a.id);
                          setSelectedIds(unchecked);
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={selectedIds.includes(a.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) =>
                            e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                          );
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.memberName}</td>
                    <td className="px-6 py-4">
                      <Badge value="paid">Checked In</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(a.checkedInAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleUndo(a.id)}>
                        Undo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          {paymentSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center">
                    <span className="text-lg">📋</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expected</p>
                    <p className="text-xl font-bold text-gray-900">{formatMMK(paymentSummary.totalExpected)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Collected</p>
                    <p className="text-xl font-bold text-emerald-600">{formatMMK(paymentSummary.totalCollected)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center">
                    <span className="text-lg">⏳</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
                    <p className="text-xl font-bold text-orange-600">{formatMMK(paymentSummary.totalPending)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <Section title="Payments">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.memberName}</td>
                      <td className="px-6 py-4 text-sm">{formatMMK(p.amount)}</td>
                      <td className="px-6 py-4 text-sm capitalize">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-6 py-4"><Badge variant="status" value={p.status}>{p.status}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
