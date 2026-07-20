import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { listEvents, createEvent, updateEventStatus } from '@/services/events';
import { registerForMember, getMyRegistration, cancelMyRegistration } from '@/services/registrations';
import { getErrorMessage } from '@/lib/utils';
import type { Event, EventStatus, PaginationMeta } from '@/types';

const initialEventForm = {
  title: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  capacity: '',
  registrationMode: 'member',
  requiresPayment: false,
  paymentAmount: '',
};

type EventTab = 'upcoming' | 'past' | 'drafts';

export function useEventsPage(
  userRole: string | undefined,
  page: number,
  limit: number,
  setMeta: (meta: PaginationMeta) => void
) {
  const { toast } = useToast();
  const canManageEvents = userRole === 'admin' || userRole === 'staff';

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<EventTab>('upcoming');
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({ ...initialEventForm }));

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusMap: Record<EventTab, EventStatus> = {
        upcoming: 'published',
        past: 'completed',
        drafts: 'draft',
      };

      const res = await listEvents({
        page,
        limit,
        status: statusMap[tab],
      });

      setEvents(res.data);
      setMeta(res.meta);

      if (!canManageEvents) {
        const registrationPromises = res.data.map((event) =>
          getMyRegistration(event.id).then((registration) => ({
            eventId: event.id,
            registered: !!registration,
          }))
        );

        const results = await Promise.all(registrationPromises);
        setMyRegistrations(new Set(results.filter((result) => result.registered).map((result) => result.eventId)));
      } else {
        setMyRegistrations(new Set());
      }
    } catch {
      toast('Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, tab, canManageEvents, setMeta, toast]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const handleCreate = useCallback(
    async (publish: boolean) => {
      // Validate end date is after start date
      if (form.startDate && form.endDate) {
        const startDate = new Date(form.startDate);
        const endDate = new Date(form.endDate);
        if (endDate <= startDate) {
          toast('End date must be after start date', 'error');
          return;
        }
      }

      try {
        await createEvent({
          ...form,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : undefined,
        });

        toast(publish ? 'Event created' : 'Event saved as draft', 'success');
        setShowCreateModal(false);
        setStep(1);
        setForm({ ...initialEventForm });
        await fetchEvents();
      } catch (error: unknown) {
        toast(getErrorMessage(error) || 'Failed to create event', 'error');
      }
    },
    [form, fetchEvents, toast]
  );

  const handleStatusChange = useCallback(
    async (eventId: string, status: string) => {
      try {
        await updateEventStatus(eventId, status);
        toast(`Event ${status}`, 'success');
        await fetchEvents();
      } catch {
        toast('Failed to update status', 'error');
      }
    },
    [fetchEvents, toast]
  );

  const handleRegister = useCallback(
    async (eventId: string) => {
      try {
        await registerForMember(eventId);
        toast('Successfully registered for event', 'success');
        setMyRegistrations((prev) => new Set([...prev, eventId]));
        await fetchEvents();
      } catch (error: unknown) {
        toast(getErrorMessage(error) || 'Failed to register', 'error');
      }
    },
    [fetchEvents, toast]
  );

  const handleCancelRegistration = useCallback(
    async (eventId: string) => {
      try {
        await cancelMyRegistration(eventId);
        toast('Registration cancelled', 'success');
        setMyRegistrations((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        await fetchEvents();
      } catch (error: unknown) {
        toast(getErrorMessage(error) || 'Failed to cancel registration', 'error');
      }
    },
    [fetchEvents, toast]
  );

  const tabs = canManageEvents ? ['upcoming', 'past', 'drafts'] as const : ['upcoming', 'past'] as const;

  return {
    events,
    isLoading,
    tab,
    setTab,
    myRegistrations,
    showCreateModal,
    setShowCreateModal,
    cancelEventId,
    setCancelEventId,
    step,
    setStep,
    form,
    setForm,
    canManageEvents,
    tabs,
    handleCreate,
    handleStatusChange,
    handleRegister,
    handleCancelRegistration,
  };
}
