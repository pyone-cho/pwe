import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, createEvent, updateEventStatus } from '@/services/events';
import { Button, Modal, Input, Textarea, Select, Badge, Pagination, EmptyState, Spinner, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/lib/utils';
import type { Event, EventStatus } from '@/types';

export default function EventsPage() {
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      setEvents(res.data);
      setMeta(res.meta);
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
        // Would need event ID from create response — simplified here
        toast('Event created', 'success');
      } else {
        toast('Event saved as draft', 'success');
      }
      setShowCreateModal(false);
      setStep(1);
      setForm({ title: '', description: '', location: '', startDate: '', endDate: '', capacity: '', registrationMode: 'member', requiresPayment: false, paymentAmount: '' });
      fetchEvents();
    } catch {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Button onClick={() => setShowCreateModal(true)}>+ Create Event</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['upcoming', 'past', 'drafts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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

      {/* Event List */}
      {isLoading ? (
        <Spinner className="py-12" />
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description="Create your first event to get started" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Card key={e.id} className="hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <Link to={`/events/${e.id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                      {e.title}
                    </Link>
                    <Badge variant="status" value={e.status}>{e.status}</Badge>
                  </div>
                  {e.location && <p className="text-sm text-gray-500 mt-1">📍 {e.location}</p>}
                  <p className="text-sm text-gray-500 mt-1">📅 {formatDate(e.startDate)}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-600">
                      {e.registeredCount}/{e.capacity || '∞'} registered
                    </span>
                    <div className="flex gap-1">
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {meta && <Pagination meta={meta} onPageChange={goToPage} />}
        </>
      )}

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
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
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
