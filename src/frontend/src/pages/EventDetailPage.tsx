import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, updateEventStatus } from '@/services/events';
import { listRegistrations, cancelRegistration } from '@/services/registrations';
import { listAttendance, bulkCheckIn, undoCheckIn } from '@/services/attendance';
import { listPayments, getPaymentSummary } from '@/services/payments';
import { Button, Badge, Spinner, Card, CardContent, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatMMK } from '@/lib/utils';
import type { Event, Registration, AttendanceRecord, AttendanceStats, Payment, PaymentSummary } from '@/types';

type Tab = 'overview' | 'registrations' | 'attendance' | 'payments';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!id) return;
    getEvent(id)
      .then((e) => { setEvent(e); setIsLoading(false); })
      .catch(() => { toast('Event not found', 'error'); setIsLoading(false); });
  }, [id]);

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

  if (isLoading) return <Spinner size="lg" className="mt-12" />;
  if (!event) return <div className="text-center py-12 text-gray-500">Event not found</div>;

  const filteredRegistrations = registrations.filter((r) =>
    search ? (r.guestName || r.member?.firstName || '').toLowerCase().includes(search.toLowerCase()) : true
  );

  const filteredAttendance = attendance.filter((a) =>
    search ? a.memberName.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link to="/events" className="text-sm text-indigo-600 hover:underline">← Back to Events</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            <Badge variant="status" value={event.status}>{event.status}</Badge>
            {event.location && <span>📍 {event.location}</span>}
            <span>📅 {formatDate(event.startDate)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {event.status === 'draft' && (
            <Button onClick={() => handleStatusChange('published')}>Publish</Button>
          )}
          {event.status === 'published' && (
            <>
              <Button variant="secondary" onClick={() => handleStatusChange('completed')}>Complete</Button>
              <Button variant="danger" onClick={() => handleStatusChange('cancelled')}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent>
          <p className="text-sm text-gray-500">Registered</p>
          <p className="text-2xl font-bold text-indigo-600">{event.registeredCount}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="text-2xl font-bold text-gray-900">{event.capacity || '∞'}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-gray-500">Checked In</p>
          <p className="text-2xl font-bold text-green-600">{attendanceStats?.checkedIn ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-orange-600">
            {paymentSummary ? formatMMK(paymentSummary.totalCollected) : '—'}
          </p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['overview', 'registrations', 'attendance', 'payments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => loadTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <Card>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description || 'No description'}</p>
            {event.requiresPayment && (
              <p className="mt-4 text-sm text-gray-600">Payment: {formatMMK(event.paymentAmount || 0)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'registrations' && (
        <Card>
          <div className="px-6 py-3 border-b">
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
                  <tr key={r.id} className="border-b border-gray-100">
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
        </Card>
      )}

      {tab === 'attendance' && (
        <Card>
          <div className="px-6 py-3 border-b flex items-center justify-between gap-4">
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
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
            {attendanceStats && (
              <span>{attendanceStats.checkedIn} / {attendanceStats.total} checked in</span>
            )}
          </div>
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
                          // Select all not-yet-checked-in
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
                  <tr key={a.id} className="border-b border-gray-100">
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
        </Card>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          {paymentSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent>
                <p className="text-sm text-gray-500">Total Expected</p>
                <p className="text-xl font-bold">{formatMMK(paymentSummary.totalExpected)}</p>
              </CardContent></Card>
              <Card><CardContent>
                <p className="text-sm text-gray-500">Collected</p>
                <p className="text-xl font-bold text-green-600">{formatMMK(paymentSummary.totalCollected)}</p>
              </CardContent></Card>
              <Card><CardContent>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-orange-600">{formatMMK(paymentSummary.totalPending)}</p>
              </CardContent></Card>
            </div>
          )}
          <Card>
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
                    <tr key={p.id} className="border-b border-gray-100">
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
          </Card>
        </div>
      )}
    </div>
  );
}
