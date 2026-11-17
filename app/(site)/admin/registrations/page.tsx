import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLogin } from "@/components/AdminLogin";
import { isAdminCookie } from "@/lib/admin";
import { HEARD_ABOUT } from "@/lib/validation";
import { listRegistrations } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registrations",
  robots: { index: false, follow: false },
};

const heard = new Map(HEARD_ABOUT.map((option) => [option.value, option.label]));

export default async function RegistrationsPage() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-4xl">Registrations</h1>
        <p className="mt-4 text-muted">Set ADMIN_PASSWORD in the server environment to open this page.</p>
      </div>
    );
  }

  const jar = await cookies();
  if (!isAdminCookie(jar.get("admin_session")?.value)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-4xl">Registrations</h1>
        <p className="mb-8 mt-4 text-muted">Enter the admin password to see who has registered.</p>
        <AdminLogin />
      </div>
    );
  }

  const rows = await listRegistrations();
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Registrations</h1>
          <p className="mt-2 text-muted">{rows.length === 1 ? "1 registration" : `${rows.length} registrations`}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/api/admin/registrations" className="inline-flex min-h-11 items-center rounded-md border border-line px-4">
            Download CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-md border border-line px-4">
              Log out
            </button>
          </form>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-10 text-muted">No one has registered yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Event</th>
                <th className="py-2 pr-4 font-semibold">Guests</th>
                <th className="py-2 pr-4 font-semibold">Phone</th>
                <th className="py-2 pr-4 font-semibold">Heard</th>
                <th className="py-2 pr-4 font-semibold">Access</th>
                <th className="py-2 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4">{row.fullName}</td>
                  <td className="py-3 pr-4">{row.email}</td>
                  <td className="py-3 pr-4">{row.eventSlug}</td>
                  <td className="py-3 pr-4">{row.guests}</td>
                  <td className="py-3 pr-4">{row.phone ?? ""}</td>
                  <td className="py-3 pr-4">{row.heardAbout ? heard.get(row.heardAbout as "friend") ?? row.heardAbout : ""}</td>
                  <td className="py-3 pr-4">{row.accessibility ?? ""}</td>
                  <td className="py-3">{row.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
