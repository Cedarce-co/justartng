import type { Metadata } from "next";
import { site } from "@/lib/content";
import { publicText, safeHttpUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.artist} and ${site.exhibition}.`,
};

export default function AboutPage() {
  const email = publicText(site.email);
  const socials = site.socials.flatMap((item) => {
    const url = safeHttpUrl(item.url);
    return url ? [{ label: item.label, url }] : [];
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{site.exhibition}</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">{site.artist}</h1>
      <section className="mt-10">
        <h2 className="text-2xl">Artist</h2>
        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">{site.bio}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl">Exhibition</h2>
        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">{site.statement}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl">Contact</h2>
        {email ? (
          <a className="mt-4 inline-flex min-h-11 items-center text-lg text-accent underline-offset-4 hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        ) : (
          <p className="mt-4 text-lg text-muted">Contact email to be supplied.</p>
        )}
        {socials.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-4">
            {socials.map((item) => (
              <li key={item.url}>
                <a className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline" href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Social links to be supplied.</p>
        )}
      </section>
    </div>
  );
}
