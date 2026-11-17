import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Missing page</p>
      <h1 className="mt-3 text-4xl">This page is not in the exhibition.</h1>
      <p className="mt-4 text-muted">The link may be out of date. The gathering and the visual studio are still here.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-on">
          The gathering
        </Link>
        <Link href="/visual-studio" className="inline-flex min-h-11 items-center rounded-md border border-line px-4">
          Visual Studio
        </Link>
      </div>
    </div>
  );
}
