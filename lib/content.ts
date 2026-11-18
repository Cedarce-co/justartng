import eventsJson from "@/content/events.json";
import roomsJson from "@/content/rooms.json";
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
  writeup: string;
  image: string;
  alt: string;
  imageWidth: number;
  imageHeight: number;
  widthM: number;
  heightM: number;
};

/** A room in the visual studio. `works` lists slugs in hanging order; a painting can hang in more than one room. */
export type Room = {
  id: string;
  name: string;
  subtitle: string;
  welcome: string;
  wallColor: string;
  works: string[];
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
export const rooms = roomsJson as Room[];
export const events = eventsJson as GalleryEvent[];
export const site = siteJson as SiteContent;

/** The main room: the current exhibition, opened by default. */
export const mainRoom = rooms[0];

export function getRoom(id: string | null | undefined) {
  return rooms.find((room) => room.id === id) ?? null;
}

export function roomWorks(room: Room) {
  return room.works.map((slug) => getWork(slug)).filter((work): work is Work => work !== null);
}

/** The rooms a painting hangs in, main room first. */
export function roomsFor(slug: string) {
  return rooms.filter((room) => room.works.includes(slug));
}

/** Link into the studio: a room, optionally walking straight to one painting. */
export function studioHref(room: Room, slug?: string) {
  const params = new URLSearchParams();
  if (room.id !== mainRoom.id) params.set("room", room.id);
  if (slug) params.set("work", slug);
  const query = params.toString();
  return query ? `/visual-studio?${query}` : "/visual-studio";
}

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
