import { useState, useEffect } from 'react';
import { listAnnouncements, createAnnouncement, updateAnnouncementStatus } from '@/services/announcements';
import { Button, Modal, Input, Textarea, Select, Badge, Pagination, EmptyState, Spinner, Card, CardContent } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Announcement, AnnouncementPriority } from '@/types';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { page, limit, meta, setMeta, goToPage } = usePagination();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as AnnouncementPriority,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const fetchAnnouncements = async () => {
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
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement({ ...form, status: 'published' });
      toast('Announcement published', 'success');
      setShowCreateModal(false);
      setForm({ title: '', content: '', priority: 'normal' });
      fetchAnnouncements();
    } catch {
      toast('Failed to create announcement', 'error');
    }
  };

  const priorityOrder: Record<AnnouncementPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  const sorted = [...announcements].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>+ New Announcement</Button>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : sorted.length === 0 ? (
        <EmptyState title="No announcements" description="Check back later for updates" />
      ) : (
        <>
          <div className="space-y-3">
            {sorted.map((a) => (
              <Card
                key={a.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  a.priority === 'urgent' ? 'border-red-300 bg-red-50' : ''
                }`}
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              >
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="status" value={a.priority}>{a.priority}</Badge>
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      </div>
                      {expandedId === a.id ? (
                        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{a.content}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                  {expandedId === a.id && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateAnnouncementStatus(a.id, 'archived')
                            .then(() => { toast('Archived', 'success'); fetchAnnouncements(); })
                            .catch(() => toast('Failed', 'error'));
                        }}
                      >
                        Archive
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && <Pagination meta={meta} onPageChange={goToPage} />}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={5}
            required
          />
          <Select
            label="Priority"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
