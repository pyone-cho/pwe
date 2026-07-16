import { useState, useEffect } from 'react';
import { listAnnouncements, createAnnouncement, updateAnnouncementStatus } from '@/services/announcements';
import { Button, Modal, Input, Textarea, Select, Badge, Pagination, EmptyState, Card, CardContent, PageHeader, Section } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime, formatDate } from '@/lib/utils';
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
  const [filter, setFilter] = useState<'all' | AnnouncementPriority>('all');
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

  const sorted = [...announcements]
    .filter((a) => filter === 'all' || a.priority === filter)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const urgentCount = announcements.filter((a) => a.priority === 'urgent').length;
  const highCount = announcements.filter((a) => a.priority === 'high').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Stay updated with your organization</p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              {urgentCount} urgent
            </span>
          )}
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>+ New Announcement</Button>
          )}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['all', 'urgent', 'high', 'normal', 'low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-lg transition-all duration-200 ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
            {f === 'urgent' && urgentCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700">{urgentCount}</span>
            )}
            {f === 'high' && highCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">{highCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className={`h-1 ${i === 0 ? 'bg-red-400' : 'bg-gray-100'}`} />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded-lg w-1/3 animate-pulse" />
                </div>
                <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No announcements yet' : `No ${filter} announcements`}
          description={
            filter === 'all'
              ? "Updates from your organization will appear here."
              : `No announcements with ${filter} priority at the moment.`
          }
          variant={filter === 'urgent' ? 'info' : 'empty'}
        />
      ) : (
        <>
          <div className="space-y-4">
            {sorted.map((a, index) => {
              const isExpanded = expandedId === a.id;
              const isUrgent = a.priority === 'urgent';
              const isHigh = a.priority === 'high';

              return (
                <div
                  key={a.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card
                    hover
                    className={`overflow-hidden ${
                      isUrgent ? 'border-red-200 bg-red-50' :
                      isHigh ? 'border-orange-200 bg-orange-50' : ''
                    }`}
                  >
                    <div className={`h-1 ${
                      isUrgent ? 'bg-red-500' :
                      isHigh ? 'bg-orange-500' :
                      'bg-brand-500'
                    }`} />

                    <CardContent className="p-0">
                      {/* Clickable header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="w-full text-left p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="status" value={a.priority}>
                                {isUrgent && '🔴 '}{a.priority}
                              </Badge>
                              {a.eventTitle && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  📅 {a.eventTitle}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                            {!isExpanded && (
                              <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{a.content}</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatDate(a.createdAt)}
                            </span>
                            <svg
                              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {a.content}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <span className="h-5 w-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-medium text-brand-700">
                                  {a.authorName?.[0] || 'A'}
                                </span>
                                {a.authorName}
                              </span>
                              <span>·</span>
                              <span>{formatDateTime(a.createdAt)}</span>
                            </div>

                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAnnouncementStatus(a.id, 'archived')
                                    .then(() => { toast('Archived', 'success'); fetchAnnouncements(); })
                                    .catch(() => toast('Failed', 'error'));
                                }}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                Archive
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
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
              { value: 'low', label: '🟢 Low' },
              { value: 'normal', label: '🔵 Normal' },
              { value: 'high', label: '🟠 High' },
              { value: 'urgent', label: '🔴 Urgent' },
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
