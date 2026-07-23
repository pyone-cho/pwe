import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, Button, Spinner } from '@/components/ui';
import { formatDate, formatMMK } from '@/lib/utils';
import publicApi from '@/lib/publicApi';
import type { Event } from '@/types';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicApi
      .get('/events/public')
      .then((res) => {
        const data = res.data.data;
        const eventsList = Array.isArray(data) ? data : data?.data ?? [];
        const mapped = eventsList.map((e: any) => ({
          ...e,
          registeredCount: e._count?.registrations ?? 0,
        }));
        setEvents(mapped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Redirect authenticated users to dashboard
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PWE</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-brand-500" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
              Membership management for Myanmar
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white">
              Run Your Organization
              <br />
              <span className="text-white/90">
                Like Never Before
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto leading-relaxed">
              Events, members, payments, and announcements — all in one beautiful platform for clubs, societies, and community groups.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" variant="outline" className="!bg-white !text-brand-600 hover:!bg-brand-50 !border-white">
                  Start Free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in">
            {[
              { label: 'Organizations', value: '50+' },
              { label: 'Events Hosted', value: '200+' },
              { label: 'Members Managed', value: '5K+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-brand-200/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Everything You Need
          </h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            Powerful tools to manage your organization, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📅', title: 'Event Management', desc: 'Create events with registration, capacity tracking, and custom fields.' },
            { icon: '👥', title: 'Member Directory', desc: 'Manage members with search, filters, and CSV import/export.' },
            { icon: '💰', title: 'Payment Tracking', desc: 'Record payments, track status, and generate financial reports.' },
            { icon: '📢', title: 'Announcements', desc: 'Send organization-wide updates with priority levels.' },
            { icon: '✅', title: 'Attendance', desc: 'Real-time check-in with live counters and bulk operations.' },
            { icon: '📊', title: 'Reports & Analytics', desc: 'Insights on members, events, and financial performance.' },
          ].map((feature) => (
            <Card key={feature.title} hover className="p-6 group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Upcoming Events</h2>
            <p className="mt-3 text-gray-500">See what's happening — join an event or create your own organization.</p>
          </div>

          {isLoading ? (
            <Spinner className="py-16" />
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 flex items-center justify-center">
                <span className="text-3xl">📅</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">No upcoming events</h4>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">Check back later or create your own organization to start hosting events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.id}
                  hover
                  className="overflow-hidden group"
                >
                  <div className="h-1 bg-brand-500" />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {event.title}
                      </h4>
                      <Badge variant="status" value={event.status}>
                        {event.status}
                      </Badge>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-2.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span>
                          {event.registeredCount}
                          {event.capacity ? ` / ${event.capacity}` : ''} registered
                        </span>
                      </div>
                      {event.requiresPayment && event.paymentAmount && (
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span>{formatMMK(event.paymentAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      {event.registrationMode === 'public' || event.registrationMode === 'both' ? (
                        <Link to="/register">
                          <Button className="w-full" size="sm">
                            Register Now
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/login">
                          <Button className="w-full" size="sm" variant="outline">
                            Sign In to Register
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-xl bg-brand-500 px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold text-white">Ready to Get Started?</h2>
          <p className="mt-3 text-brand-100 max-w-lg mx-auto">
            Create your organization in minutes. Free for small teams.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="outline" className="!bg-white !text-brand-600 hover:!bg-brand-50 !border-white">
                Create Organization
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-white">PWE</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Create Organization</Link>
              <Link to="/register" className="hover:text-white transition-colors">Join as Member</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} PWE. Membership management for Myanmar organizations.
          </div>
        </div>
      </footer>
    </div>
  );
}
