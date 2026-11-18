import { NextResponse } from "next/server";
import { getWork, roomsFor } from "@/lib/content";
import { sendCollectorAlert } from "@/lib/email";
import { InterestStorageError, saveInterest } from "@/lib/interests";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { collectSchema } from "@/lib/validation";

/** The studio guide sends a visitor's interest in collecting a painting here. */
export async function POST(request: Request) {
  if (!rateLimit(`collect:${clientIp(request)}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = collectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }

  const work = getWork(parsed.data.workSlug);
  if (!work) return NextResponse.json({ ok: false, error: "That painting could not be found." }, { status: 404 });
  const room = roomsFor(work.slug).find((item) => item.id === parsed.data.room)?.name ?? parsed.data.room;

  try {
    const interest = await saveInterest({
      workSlug: work.slug,
      workTitle: work.title,
      room,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      payment: parsed.data.payment,
      address: parsed.data.address,
      delivery: parsed.data.delivery,
    });
    const notified = await sendCollectorAlert(interest);
    return NextResponse.json({ ok: true, notified }, { status: 201 });
  } catch (error) {
    if (error instanceof InterestStorageError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "We couldn't send that just now. Please try again." }, { status: 500 });
  }
}
