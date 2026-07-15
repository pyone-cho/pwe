import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Spinner, PageHeader, Section, EmptyState } from '@/components/ui';
import { getMyMember } from '@/services/members';
import { listEvents } from '@/services/events';
import { listAnnouncements } from '@/services/announcements';
import { formatDate, statusColor } from '@/lib/utils';
import type { Member, Event, Announcement } from '@/types';

export default function MemberDashboardPage() {
  const { user, organization } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyMember().catch(() => null),
      listEvents({ limit: 5, sort: 'startDate', order: 'asc' }).catch(() => null),
      listAnnouncements({ status: 'published', limit: 5 }).catch(() => null),
    ]).then(([memberData, evts, anns]) => {
      setMember(memberData);
      setEvents(evts?.data || []);
      setAnnouncements(anns?.data || []);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <Spinner size="lg" className="mt-12" />;

  const stats = [
    { label: 'Membership Status', value: member?.membershipStatus ?? 'N/A', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Membership Type', value: member?.membershipType ?? 'Regular', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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

      {/* Membership Info */}
      {member && (
        <Section
          title="My Membership"
          description="Your membership details"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{member.phone}</p>
            </div>
            {member.email && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{member.email}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(member.joinDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${statusColor(member.membershipStatus)}`}>
                {member.membershipStatus}
              </span>
            </div>
            {member.membershipType && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{member.membershipType}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Upcoming Events"
          description="Events you can register for"
          action={<Link to="/events" className="text-sm text-indigo-600 hover:underline">View all</Link>}
        >
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Check back later for new events."
              variant="info"
            />
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
          description="Recent updates from your organization"
          action={<Link to="/announcements" className="text-sm text-indigo-600 hover:underline">View all</Link>}
        >
          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Updates from your organization will appear here."
              variant="empty"
            />
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
