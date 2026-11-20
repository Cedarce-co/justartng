import { z } from "zod";

export const HEARD_ABOUT = [
  { value: "friend", label: "Friend or family" },
  { value: "social", label: "Social media" },
  { value: "gallery", label: "The visual studio" },
  { value: "church", label: "Church" },
  { value: "other", label: "Other" },
] as const;

export const registerSchema = z.object({
  eventSlug: z.string().min(1),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120, "Use 120 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  phone: z.string().trim().max(40, "Use 40 characters or fewer."),
  guests: z.coerce
    .number({ invalid_type_error: "Choose how many people are coming." })
    .int()
    .min(1, "At least one guest.")
    .max(5, "You can register up to 5 guests."),
  heardAbout: z.enum(["", "friend", "social", "gallery", "church", "other"]),
  accessibility: z.string().trim().max(500, "Use 500 characters or fewer."),
  consent: z.boolean().refine((value) => value, { message: "Please confirm so we can keep your place." }),
});

export const registerRequestSchema = registerSchema.extend({
  company: z.string().optional().default(""),
});

export type RegisterInput = z.infer<typeof registerSchema>;
