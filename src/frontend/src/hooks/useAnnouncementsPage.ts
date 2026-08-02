import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/hooks/useAuth';
import { createAnnouncement, listAnnouncements, updateAnnouncementStatus } from '@/services/announcements';
import type { Announcement, AnnouncementPriority } from '@/types';

interface AnnouncementFormState {
  title: string;
  content: string;
  priority: AnnouncementPriority;
}

const emptyForm: AnnouncementFormState = {
  title: '',
  content: '',
  priority: 'normal',
};

export function useAnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | AnnouncementPriority>('all');
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listAnnouncements({ page, limit, status: 'published' });
      setAnnouncements(res.data);
      setMeta(res.meta);
    } catch {
      toast('Failed to load announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, setMeta, toast]);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement({ ...form, status: 'published' });
      toast('Announcement published', 'success');
      setShowCreateModal(false);
      setForm(emptyForm);
      void fetchAnnouncements();
    } catch {
      toast('Failed to create announcement', 'error');
    }
  }, [fetchAnnouncements, form, toast]);

  const handleArchive = useCallback(async (announcement: Announcement) => {
    try {
      await updateAnnouncementStatus(announcement.id, 'archived');
      toast('Archived', 'success');
      void fetchAnnouncements();
    } catch {
      toast('Failed', 'error');
    }
  }, [fetchAnnouncements, toast]);

  const priorityOrder: Record<AnnouncementPriority, number> = useMemo(() => ({
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  }), []);

  const sorted = useMemo(() => {
    return [...announcements]
      .filter((announcement) => filter === 'all' || announcement.priority === filter)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [announcements, filter, priorityOrder]);

  const urgentCount = announcements.filter((announcement) => announcement.priority === 'urgent').length;
  const highCount = announcements.filter((announcement) => announcement.priority === 'high').length;

  return {
    announcements: sorted,
    isLoading,
    isAdmin,
    showCreateModal,
    setShowCreateModal,
    expandedId,
    setExpandedId,
    filter,
    setFilter,
    form,
    setForm,
    handleCreate,
    handleArchive,
    urgentCount,
    highCount,
    meta,
    goToPage,
  };
}
