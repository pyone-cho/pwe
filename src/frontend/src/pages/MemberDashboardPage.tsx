import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Section, EmptyState, Badge } from '@/components/ui';
import { getMyMember } from '@/services/members';
import { listEvents } from '@/services/events';
import { listAnnouncements } from '@/services/announcements';
import { formatDate } from '@/lib/utils';
import type { Member, Event, Announcement } from '@/types';

export default function MemberDashboardPage() {
  const { user, organization } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);

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
              <span className={`h-1.5 w-1.5 rounded-full ${member?.membershipStatus === 'active' ? 'bg-green-300' : 'bg-gray-300'}`} />
              {member?.membershipStatus === 'active' ? 'Active Member' : member?.membershipStatus || 'Member'}
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
        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-base">✅</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{member?.membershipStatus ?? 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <span className="text-base">🏷️</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{member?.membershipType ?? 'Regular'}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-base">📅</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Events</p>
              <p className="text-lg font-semibold text-gray-900">{events.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <span className="text-base">📢</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{announcements.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Info + Quick Actions */}
      {member && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section title="My Membership" description="Your membership details" className="lg:col-span-2">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-xl bg-brand-500 flex items-center justify-center text-lg font-semibold text-white shrink-0">
                {member.firstName?.[0]}{member.lastName?.[0] || ''}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <Badge variant="status" value={member.membershipStatus}>
                    {member.membershipStatus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{member.phone}</p>
                </div>
                {member.email && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(member.joinDate)}</p>
                </div>
                {member.membershipType && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Membership Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{member.membershipType}</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Quick Actions">
            <div className="space-y-2">
              <Link
                to="/events"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-base">📅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Browse Events</p>
                  <p className="text-xs text-gray-500">Find and register for events</p>
                </div>
              </Link>
              <Link
                to="/announcements"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-base">📢</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Announcements</p>
                  <p className="text-xs text-gray-500">Stay updated with your org</p>
                </div>
              </Link>
            </div>
          </Section>
        </div>
      )}

      {/* Events + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Upcoming Events"
          description="Events you can register for"
          action={<Link to="/events" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>}
        >
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Check back later for new events."
              variant="info"
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
              description="Updates from your organization will appear here."
              variant="empty"
            />
          ) : (
            <div className="space-y-2">
              {sortedAnnouncements.map((a) => {
                const isExpanded = expandedAnnouncement === a.id;
                const isUrgent = a.priority === 'urgent';
                return (
                  <div
                    key={a.id}
                    className={`rounded-lg border transition-colors overflow-hidden ${
                      isUrgent
                        ? 'border-red-200 bg-red-50 hover:border-red-300'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedAnnouncement(isExpanded ? null : a.id)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isUrgent && <span className="text-sm shrink-0">🔴</span>}
                          <Badge variant="status" value={a.priority}>
                            {a.priority}
                          </Badge>
                          <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                        </div>
                        <svg
                          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{a.content}</p>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          <span>By {a.authorName}</span>
                          <span>·</span>
                          <span>{formatDate(a.createdAt)}</span>
                        </div>
                      </div>
                    )}
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
