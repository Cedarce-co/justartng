import { HomeExperience } from "@/components/home/HomeExperience";
import { bodies, site, splitEvents, works } from "@/lib/content";
import { formatWhen, publicText, safeHttpUrl } from "@/lib/format";

const heroDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});
const heroTime = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Africa/Lagos",
});

function artistDetails() {
  const instagram = site.socials.find((link) => link.label.toLowerCase() === "instagram");
  const url = instagram ? safeHttpUrl(instagram.url) : null;
  const handle = url ? `@${new URL(url).pathname.replace(/\//g, "")}` : null;
  return {
    bio: (publicText(site.bio) ?? "").split(/\n\s*\n/).filter(Boolean),
    instagram: url && handle ? { handle, url } : null,
  };
}

export default function HomePage() {
  const next = splitEvents().upcoming[0];
  const start = next ? Date.parse(next.startsAt) : Number.NaN;
  const hasStart = !Number.isNaN(start);

  return (
    <HomeExperience
      hero={{
        edition: "2.0",
        date: hasStart ? heroDate.format(start) : null,
        time: hasStart ? `Doors open ${heroTime.format(start)} WAT` : null,
        venue: next ? publicText(next.venue) : null,
        address: next ? publicText(next.address) : null,
        map: next ? safeHttpUrl(next.mapUrl) : null,
        credit: "Olalekan Isiaka  |  with Melody Osagie + Omotosho John",
      }}
      artist={artistDetails()}
      studio={{ count: works.length, bodies: bodies() }}
      event={
        next
          ? {
              title: next.title,
              startsAt: hasStart ? next.startsAt : null,
              when: formatWhen(next),
              venue: publicText(next.venue),
              address: publicText(next.address),
              description: publicText(next.description),
              map: safeHttpUrl(next.mapUrl),
            }
          : null
      }
    />
  );
}
