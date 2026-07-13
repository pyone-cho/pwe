import { useState, useEffect } from 'react';
import { getMemberReport, getEventReport } from '@/services/reports';
import { Card, CardContent, Spinner, PageHeader, Section } from '@/components/ui';
import { formatMMK } from '@/lib/utils';
import type { MemberReport, EventReport } from '@/types';

type Tab = 'members' | 'events';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('members');
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null);
  const [eventReport, setEventReport] = useState<EventReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (tab === 'members') {
      getMemberReport()
        .then(setMemberReport)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      getEventReport()
        .then(setEventReport)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [tab]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      <div className="flex gap-1 border-b border-gray-200">
        {(['members', 'events'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : tab === 'members' && memberReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card><CardContent>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-indigo-600">{memberReport.total}</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{memberReport.active}</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{memberReport.inactive}</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm text-gray-500">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{memberReport.suspended}</p>
            </CardContent></Card>
          </div>

          {/* Membership Type Distribution */}
          <Section title="Membership Types">
            <div className="space-y-3">
              {memberReport.byType.map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 capitalize w-24">{item.type || 'unknown'}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-indigo-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${memberReport.total ? (item.count / memberReport.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="New Members by Month">
            <div className="flex items-end gap-2 h-40">
              {memberReport.monthly.map((m) => {
                const maxCount = Math.max(...memberReport.monthly.map((x) => x.count), 1);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{m.count}</span>
                    <div
                      className="w-full bg-indigo-400 rounded-t"
                      style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-xs text-gray-400">{m.month.slice(5, 7)}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      ) : tab === 'events' && eventReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-indigo-600">{eventReport.total}</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm text-gray-500">Avg Attendance Rate</p>
              <p className="text-2xl font-bold text-green-600">{eventReport.avgAttendance}%</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-orange-600">{formatMMK(eventReport.totalRevenue)}</p>
            </CardContent></Card>
          </div>

          {/* Event Table */}
          <Section title="Event Performance">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Registrations</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Attended</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {eventReport.events.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{e.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{e.startDate?.slice(0, 10)}</td>
                      <td className="px-6 py-4 text-sm">{e.registrations}</td>
                      <td className="px-6 py-4 text-sm">{e.attendance}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${e.attendanceRate >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                          {e.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatMMK(e.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
