import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getEvent, updateEventStatus } from '@/services/events';
import {
  listRegistrations,
  cancelRegistration,
  registerForMember,
  getMyRegistration,
  cancelMyRegistration,
} from '@/services/registrations';
import { listAttendance, bulkCheckIn, undoCheckIn } from '@/services/attendance';
import { listPayments, getPaymentSummary } from '@/services/payments';
import { getErrorMessage } from '@/lib/utils';
import type {
  Event,
  Registration,
  AttendanceRecord,
  AttendanceStats,
  Payment,
  PaymentSummary,
} from '@/types';

export type EventDetailTab = 'overview' | 'registrations' | 'attendance' | 'payments';

export function useEventDetailPage(id?: string, userRole?: string) {
  const { toast } = useToast();
  const canManageEvents = userRole === 'admin' || userRole === 'staff';

  const [event, setEvent] = useState<Event | null>(null);
  const [tab, setTab] = useState<EventDetailTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [search, setSearch] = useState('');
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);

    try {
      const eventData = await getEvent(id);
      setEvent(eventData);
      if (!canManageEvents) {
        const registration = await getMyRegistration(id);
        setMyRegistration(registration);
      } else {
        setMyRegistration(null);
      }
    } catch {
      setEvent(null);
      toast('Event not found', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, canManageEvents, toast]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const loadTab = useCallback(
    async (selectedTab: EventDetailTab) => {
      if (!id) return;
      setTab(selectedTab);
      setSearch('');
      setSelectedIds([]);

      try {
        if (selectedTab === 'registrations') {
          const res = await listRegistrations(id);
          setRegistrations(res.data);
        }

        if (selectedTab === 'attendance') {
          const res = await listAttendance(id);
          setAttendance(res.data);
          setAttendanceStats(res.stats);
        }

        if (selectedTab === 'payments') {
          const [payRes, sumRes] = await Promise.all([listPayments({ eventId: id }), getPaymentSummary(id)]);
          setPayments(payRes.data);
          setPaymentSummary(sumRes);
        }
      } catch {
        toast('Failed to load data', 'error');
      }
    },
    [id, toast]
  );

  const handleBulkCheckIn = useCallback(async () => {
    if (!id || selectedIds.length === 0) return;
    try {
      await bulkCheckIn(id, { registrationIds: selectedIds });
      toast(`${selectedIds.length} checked in`, 'success');
      setSelectedIds([]);
      await loadTab('attendance');
    } catch {
      toast('Bulk check-in failed', 'error');
    }
  }, [id, selectedIds, loadTab, toast]);

  const handleUndo = useCallback(
    async (attendanceId: string) => {
      try {
        await undoCheckIn(attendanceId);
        toast('Check-in undone', 'success');
        await loadTab('attendance');
      } catch {
        toast('Failed to undo', 'error');
      }
    },
    [loadTab, toast]
  );

  const handleCancelReg = useCallback(
    async (regId: string) => {
      try {
        await cancelRegistration(regId);
        toast('Registration cancelled', 'success');
        await loadTab('registrations');
      } catch {
        toast('Failed to cancel', 'error');
      }
    },
    [loadTab, toast]
  );

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!id) return;
      try {
        await updateEventStatus(id, status);
        toast(`Event ${status}`, 'success');
        await loadEvent();
      } catch {
        toast('Failed to update status', 'error');
      }
    },
    [id, loadEvent, toast]
  );

  const handleRegister = useCallback(async () => {
    if (!id) return;
    try {
      const reg = await registerForMember(id);
      toast('Successfully registered for event', 'success');
      setMyRegistration(reg);
      await loadEvent();
    } catch (error: unknown) {
      toast(getErrorMessage(error) || 'Failed to register', 'error');
    }
  }, [id, loadEvent, toast]);

  const handleCancelMyRegistration = useCallback(async () => {
    if (!id) return;
    try {
      await cancelMyRegistration(id);
      toast('Registration cancelled', 'success');
      setMyRegistration(null);
      await loadEvent();
    } catch (error: unknown) {
      toast(getErrorMessage(error) || 'Failed to cancel registration', 'error');
    }
  }, [id, loadEvent, toast]);

  return {
    event,
    tab,
    isLoading,
    canManageEvents,
    registrations,
    attendance,
    attendanceStats,
    selectedIds,
    payments,
    paymentSummary,
    search,
    myRegistration,
    setSearch,
    setSelectedIds,
    loadTab,
    handleBulkCheckIn,
    handleUndo,
    handleCancelReg,
    handleStatusChange,
    handleRegister,
    handleCancelMyRegistration,
  };
}
