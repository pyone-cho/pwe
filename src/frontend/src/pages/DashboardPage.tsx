import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Spinner, PageHeader, Section } from '@/components/ui';
import { getMemberReport } from '@/services/reports';
import { listEvents } from '@/services/events';
import { listAnnouncements } from '@/services/announcements';
import { formatDate } from '@/lib/utils';
import type { MemberReport, Event, Announcement } from '@/types';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (isLoading) return <Spinner size="lg" className="mt-12" />;

  const stats = [
    { label: 'Total Members', value: memberReport?.total ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Members', value: memberReport?.active ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Upcoming Events', value: events.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Announcements', value: announcements.length, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.profile?.firstName ?? 'there'}`}
        description={organization?.name}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Upcoming Events"
          description="A quick view of the next events in your organization"
          action={<Link to="/events" className="text-sm text-indigo-600 hover:underline">View all</Link>}
        >
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(e.startDate)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {e.registeredCount}/{e.capacity || '∞'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Announcements"
          description="Recent updates shared with your community"
          action={<Link to="/announcements" className="text-sm text-indigo-600 hover:underline">View all</Link>}
        >
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No announcements</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    {a.priority === 'urgent' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Urgent</span>
                    )}
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
