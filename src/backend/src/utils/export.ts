import { stringify } from "csv-stringify/sync";
import { Member, Event, Attendance, Payment } from "@prisma/client";

export interface ExportOptions {
  format: "csv" | "excel";
  filename: string;
}

interface EventWithCount extends Event {
  _count?: { registrations?: number };
}

interface AttendanceWithRelations extends Attendance {
  registration?: {
    member?: {
      firstName: string;
      lastName?: string | null;
      phone: string;
    } | null;
  } | null;
  checkedInBy?: {
    profile?: {
      firstName: string;
      lastName?: string | null;
    } | null;
  } | null;
}

interface PaymentWithRelations extends Payment {
  member?: {
    firstName: string;
    lastName?: string | null;
  } | null;
  event?: {
    title: string;
  } | null;
}

interface CsvRecord {
  [header: string]: string | number | Date | null | undefined;
}

export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns?: string[]
): string {
  if (data.length === 0) {
    return "";
  }

  // Use provided columns or extract from first row
  const headers = columns || Object.keys(data[0]);

  const records = data.map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header) => {
      record[header] = row[header] ?? "";
    });
    return record;
  });

  return stringify(records, {
    header: true,
    columns: headers.map((h) => ({ key: h, header: h })),
  });
}

export function generateMemberExportData(members: Member[]): CsvRecord[] {
  return members.map((m) => ({
    "First Name": m.firstName,
    "Last Name": m.lastName || "",
    Phone: m.phone,
    Email: m.email || "",
    "Membership Type": m.membershipType || "",
    Status: m.membershipStatus,
    "Join Date": m.joinDate?.toISOString().split("T")[0] || "",
    "Emergency Contact": m.emergencyContact || "",
    Notes: m.notes || "",
  }));
}

export function generateEventExportData(events: EventWithCount[]): CsvRecord[] {
  return events.map((e) => ({
    Title: e.title,
    Location: e.location || "",
    "Start Date": e.startDate?.toISOString() || "",
    "End Date": e.endDate?.toISOString() || "",
    Capacity: e.capacity || "Unlimited",
    Status: e.status,
    Registrations: e._count?.registrations || 0,
  }));
}

export function generateAttendanceExportData(attendance: AttendanceWithRelations[]): CsvRecord[] {
  return attendance.map((a) => ({
    Member: `${a.registration?.member?.firstName || ""} ${a.registration?.member?.lastName || ""}`.trim(),
    Phone: a.registration?.member?.phone || "",
    "Checked In": a.checkedInAt?.toISOString() || "",
    Method: a.method,
    "Checked In By": `${a.checkedInBy?.profile?.firstName || ""} ${a.checkedInBy?.profile?.lastName || ""}`.trim(),
  }));
}

export function generatePaymentExportData(payments: PaymentWithRelations[]): CsvRecord[] {
  return payments.map((p) => ({
    Member: `${p.member?.firstName || ""} ${p.member?.lastName || ""}`.trim(),
    Event: p.event?.title || "Membership",
    Amount: p.amount,
    Currency: p.currency,
    Method: p.paymentMethod || "",
    Status: p.status,
    "Reference": p.referenceNumber || "",
    "Paid At": p.paidAt?.toISOString() || "",
  }));
}
