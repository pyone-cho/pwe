import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, createEvent, updateEventStatus } from '@/services/events';
import { registerForMember, getMyRegistration, cancelMyRegistration } from '@/services/registrations';
import { Button, Modal, Input, Textarea, Select, Badge, Pagination, EmptyState, Spinner, Card, PageHeader, Section } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import type { Event, EventStatus } from '@/types';

export default function EventsPage() {
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');
  const canManageEvents = user?.role === 'admin' || user?.role === 'staff';
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: '',
    registrationMode: 'member',
    requiresPayment: false,
    paymentAmount: '',
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const statusMap = { upcoming: 'published', past: 'completed', drafts: 'draft' };
      const res = await listEvents({
        page,
        limit,
        status: statusMap[tab] as EventStatus,
      });
      // Map _count.registrations to registeredCount
      const eventsWithCount = res.data.map((e: any) => ({
        ...e,
        registeredCount: e._count?.registrations ?? 0,
      }));
      setEvents(eventsWithCount);
      setMeta(res.meta);

      // Check registration status for each event (for members only)
      if (!canManageEvents) {
        const registrationPromises = eventsWithCount.map((e: Event) =>
          getMyRegistration(e.id).then((reg) => ({ eventId: e.id, registered: !!reg }))
        );
        const results = await Promise.all(registrationPromises);
        const registeredIds = new Set(results.filter((r) => r.registered).map((r) => r.eventId));
        setMyRegistrations(registeredIds);
      }
    } catch {
      toast('Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, tab]);

  const handleCreate = async (publish: boolean) => {
    try {
      await createEvent({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : undefined,
      });
      if (publish) {
        toast('Event created', 'success');
      } else {
        toast('Event saved as draft', 'success');
      }
      setShowCreateModal(false);
      setStep(1);
      setForm({ title: '', description: '', location: '', startDate: '', endDate: '', capacity: '', registrationMode: 'member', requiresPayment: false, paymentAmount: '' });
      fetchEvents();
    } catch (error) {
      console.error('Event creation failed:', error);
      toast('Failed to create event', 'error');
    }
  };

  const handleStatusChange = async (eventId: string, status: string) => {
    try {
      await updateEventStatus(eventId, status);
      toast(`Event ${status}`, 'success');
      fetchEvents();
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      await registerForMember(eventId);
      toast('Successfully registered for event', 'success');
      setMyRegistrations((prev) => new Set([...prev, eventId]));
      fetchEvents();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      toast(message, 'error');
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      await cancelMyRegistration(eventId);
      toast('Registration cancelled', 'success');
      setMyRegistrations((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      fetchEvents();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel registration';
      toast(message, 'error');
    }
  };

  const tabs = canManageEvents ? ['upcoming', 'past', 'drafts'] : ['upcoming', 'past'] as const;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Events"
        description={canManageEvents ? "Manage your organization's events" : "Browse and register for events"}
        actions={canManageEvents ? <Button onClick={() => setShowCreateModal(true)}>+ Create Event</Button> : undefined}
      />

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="h-1 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/4 animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded-lg w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title={tab === 'drafts' ? 'No drafts' : tab === 'past' ? 'No past events' : 'No upcoming events'}
          description={
            tab === 'upcoming'
              ? "There are no upcoming events at the moment. Check back later!"
              : tab === 'drafts'
              ? "All your drafts have been published or removed."
              : "No completed events yet."
          }
          variant="info"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => {
              const isRegistered = myRegistrations.has(e.id);
              const capacityPct = e.capacity ? Math.round((e.registeredCount / e.capacity) * 100) : null;
              const isAlmostFull = capacityPct !== null && capacityPct >= 80;
              const isFull = capacityPct !== null && capacityPct >= 100;

              return (
                <Card key={e.id} hover className="group">
                  <div className={`h-1 ${
                    e.status === 'draft' ? 'bg-gray-400' :
                    e.status === 'cancelled' ? 'bg-red-400' :
                    isFull ? 'bg-red-400' :
                    'bg-brand-500'
                  }`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Link
                        to={`/events/${e.id}`}
                        className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2"
                      >
                        {e.title}
                      </Link>
                      <Badge variant="status" value={e.status}>
                        {e.status}
                      </Badge>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="h-5 w-5 rounded bg-blue-50 flex items-center justify-center text-xs">📅</span>
                        <span>{formatDate(e.startDate)}</span>
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="h-5 w-5 rounded bg-emerald-50 flex items-center justify-center text-xs">📍</span>
                          <span className="truncate">{e.location}</span>
                        </div>
                      )}
                      {e.requiresPayment && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="h-5 w-5 rounded bg-amber-50 flex items-center justify-center text-xs">💰</span>
                          <span>{e.paymentAmount?.toLocaleString()} MMK</span>
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    {capacityPct !== null && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>{e.registeredCount} / {e.capacity} registered</span>
                          <span className={`font-medium ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : 'text-gray-600'}`}>
                            {capacityPct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-500' : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(capacityPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {e.status === 'published' && !canManageEvents && (
                        isRegistered ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelEventId(e.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <span className="mr-1">✓</span> Registered
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRegister(e.id)}
                            disabled={isFull}
                          >
                            {isFull ? 'Full' : 'Register'}
                          </Button>
                        )
                      )}
                      {canManageEvents && (
                        <div className="flex gap-1.5">
                          {e.status === 'draft' && (
                            <Button size="sm" onClick={() => handleStatusChange(e.id, 'published')}>
                              Publish
                            </Button>
                          )}
                          {e.status === 'published' && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => handleStatusChange(e.id, 'completed')}>
                                Complete
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleStatusChange(e.id, 'cancelled')}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      <Link
                        to={`/events/${e.id}`}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline ml-auto"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {meta && <Pagination meta={meta} onPageChange={goToPage} />}
        </>
      )}

      {/* Cancel Registration Confirmation */}
      <Modal
        isOpen={!!cancelEventId}
        onClose={() => setCancelEventId(null)}
        title="Cancel Registration"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to cancel your registration for this event?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={() => setCancelEventId(null)}>
            Keep Registration
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (cancelEventId) {
                handleCancelRegistration(cancelEventId);
                setCancelEventId(null);
              }
            }}
          >
            Yes, Cancel
          </Button>
        </div>
      </Modal>

      {/* Create Event Wizard */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setStep(1); }}
        title={`Create Event — Step ${step} of 4`}
        size="lg"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <Input
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
            <Input
              label="Capacity (optional)"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Select
              label="Registration Mode"
              options={[
                { value: 'member', label: 'Members Only' },
                { value: 'public', label: 'Public' },
                { value: 'both', label: 'Both' },
              ]}
              value={form.registrationMode}
              onChange={(e) => setForm({ ...form, registrationMode: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresPayment"
                checked={form.requiresPayment}
                onChange={(e) => setForm({ ...form, requiresPayment: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <label htmlFor="requiresPayment" className="text-sm font-medium text-gray-700">
                Requires Payment
              </label>
            </div>
            {form.requiresPayment && (
              <Input
                label="Payment Amount (MMK)"
                type="number"
                value={form.paymentAmount}
                onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Custom fields can be added after event creation.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><span className="font-medium">Title:</span> {form.title}</p>
              <p><span className="font-medium">Location:</span> {form.location || '—'}</p>
              <p><span className="font-medium">Dates:</span> {form.startDate} → {form.endDate}</p>
              <p><span className="font-medium">Capacity:</span> {form.capacity || 'Unlimited'}</p>
              <p><span className="font-medium">Registration:</span> {form.registrationMode}</p>
              {form.requiresPayment && (
                <p><span className="font-medium">Payment:</span> {form.paymentAmount} MMK</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {step === 4 ? (
              <>
                <Button variant="secondary" onClick={() => handleCreate(false)}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleCreate(true)}>
                  Publish
                </Button>
              </>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
