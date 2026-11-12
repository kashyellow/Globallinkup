import { z } from "zod";

/** Admin "Invite user" form (ADR 0010). The email is normalised before any lookup. */
export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  fullName: z.string().trim().min(2).max(60),
  locale: z.enum(["en", "es"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
