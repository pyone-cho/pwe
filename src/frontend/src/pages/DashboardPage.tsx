import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Section, EmptyState, Badge } from '@/components/ui';
import { getMemberReport } from '@/services/reports';
import { listEvents } from '@/services/events';
import { listAnnouncements } from '@/services/announcements';
import { formatDate } from '@/lib/utils';
import type { MemberReport, Event, Announcement } from '@/types';
import MemberDashboardPage from './MemberDashboardPage';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'member') {
      setIsLoading(false);
      return;
    }

    Promise.all([
      getMemberReport().catch(() => null),
      listEvents({ limit: 5, sort: 'startDate', order: 'asc' }).catch(() => null),
      listAnnouncements({ status: 'published', limit: 5 }).catch(() => null),
    ]).then(([members, evts, anns]) => {
      setMemberReport(members);
      setEvents(evts?.data || []);
      setAnnouncements(anns?.data || []);
      setIsLoading(false);
    });
  }, [user?.role]);

  if (user?.role === 'member') {
    return <MemberDashboardPage />;
  }

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

  const stats = [
    { label: 'Total Members', value: memberReport?.total ?? 0, icon: '👥', bg: 'bg-brand-50', color: 'text-brand-600' },
    { label: 'Active Members', value: memberReport?.active ?? 0, icon: '✅', bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Upcoming Events', value: events.length, icon: '📅', bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Announcements', value: announcements.length, icon: '📢', bg: 'bg-orange-50', color: 'text-orange-600' },
  ];

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
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
              Admin
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
        {stats.map((s) => (
          <Card key={s.label} hover>
            <CardContent className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <span className="text-base">{s.icon}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Org Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="Quick Actions">
          <div className="space-y-2">
            <Link
              to="/members"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <span className="text-base">👥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Manage Members</p>
                <p className="text-xs text-gray-500">View and manage your members</p>
              </div>
            </Link>
            <Link
              to="/events"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="text-base">📅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Event</p>
                <p className="text-xs text-gray-500">Plan your next event</p>
              </div>
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <span className="text-base">📈</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Reports</p>
                <p className="text-xs text-gray-500">Analytics and insights</p>
              </div>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-base">⚙️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Settings</p>
                <p className="text-xs text-gray-500">Organization settings</p>
              </div>
            </Link>
          </div>
        </Section>

        <Section title="Organization" description="Your organization at a glance" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
              <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <span className="text-sm">🏢</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Organization</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{organization?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <span className="text-sm">👥</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Members</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{memberReport?.total ?? 0}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-sm">📅</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Events</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{events.length}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <span className="text-sm">📢</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Published Alerts</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{announcements.length}</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Events + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Upcoming Events"
          description="Events happening soon"
          action={<Link to="/events" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>}
        >
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Create your next event to keep the community engaged."
              variant="info"
              action={<Link to="/events" className="text-sm font-medium text-brand-600 hover:underline">Create one</Link>}
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
              description="Updates shared with your organization will appear here."
              variant="empty"
            />
          ) : (
            <div className="space-y-2">
              {sortedAnnouncements.map((a) => {
                const isUrgent = a.priority === 'urgent';
                const isHigh = a.priority === 'high';
                return (
                  <div
                    key={a.id}
                    className={`rounded-lg border transition-colors overflow-hidden ${
                      isUrgent
                        ? 'border-red-200 bg-red-50'
                        : isHigh
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && <span className="text-sm">🔴</span>}
                        <Badge variant="status" value={a.priority}>
                          {a.priority}
                        </Badge>
                        {a.eventTitle && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            📅 {a.eventTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="h-4 w-4 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-medium text-brand-700">
                            {a.authorName?.[0] || 'A'}
                          </span>
                          {a.authorName}
                        </span>
                        <span>·</span>
                        <span>{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
