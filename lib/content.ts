import eventsJson from "@/content/events.json";
import siteJson from "@/content/site.json";
import worksJson from "@/content/works.json";

export type Wall = "back" | "left" | "right";

export type Work = {
  slug: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  size: string;
  body: string;
  writeup: string;
  image: string;
  alt: string;
  imageWidth: number;
  imageHeight: number;
  wall: Wall;
  position: number;
  widthM: number;
  heightM: number;
};

export type GalleryEvent = {
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  address: string;
  mapUrl: string;
  description: string;
  capacity: number;
  registrationOpen: boolean;
};

export type SocialLink = { label: string; url: string };

export type SiteContent = {
  artist: string;
  exhibition: string;
  brand: string;
  tagline: string;
  description: string;
  intro: string;
  bio: string;
  statement: string;
  artistWord: string;
  email: string;
  socials: SocialLink[];
};

export const works = worksJson as Work[];
export const events = eventsJson as GalleryEvent[];
export const site = siteJson as SiteContent;

export function getWork(slug: string) {
  return works.find((work) => work.slug === slug) ?? null;
}

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug) ?? null;
}

export function neighbors(slug: string) {
  const index = works.findIndex((work) => work.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: works[(index - 1 + works.length) % works.length],
    next: works[(index + 1) % works.length],
  };
}

export function bodies() {
  const list: string[] = [];
  for (const work of works) {
    if (!list.includes(work.body)) list.push(work.body);
  }
  return list;
}

export function worksByBody() {
  return bodies().map((body) => ({
    body,
    works: works.filter((work) => work.body === body),
  }));
}

function eventTime(event: GalleryEvent) {
  const time = Date.parse(event.startsAt);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function splitEvents(now = Date.now()) {
  const upcoming: GalleryEvent[] = [];
  const past: GalleryEvent[] = [];
  for (const event of events) {
    const end = Date.parse(event.endsAt || event.startsAt);
    if (!Number.isNaN(end) && end < now) past.push(event);
    else upcoming.push(event);
  }
  upcoming.sort((a, b) => eventTime(a) - eventTime(b));
  past.sort((a, b) => eventTime(b) - eventTime(a));
  return { upcoming, past };
}

export function workMeta(work: Pick<Work, "medium" | "size">) {
  return [work.medium, work.size].filter(Boolean).join(", ");
}

export function textureUrl(image: string, quality: "standard" | "high") {
  if (quality === "high") return image;
  return image.replace(/\.webp$/, "-std.webp");
}
