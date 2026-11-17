import { HomeExperience } from "@/components/home/HomeExperience";
import { bodies, splitEvents, works } from "@/lib/content";
import { formatWhen, publicText, safeHttpUrl } from "@/lib/format";

export default function HomePage() {
  const next = splitEvents().upcoming[0];
  const art = works[1];

  return (
    <HomeExperience
      art={{ src: art.image, alt: art.alt, width: art.imageWidth, height: art.imageHeight }}
      studio={{ count: works.length, bodies: bodies() }}
      event={
        next
          ? {
              title: next.title,
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
