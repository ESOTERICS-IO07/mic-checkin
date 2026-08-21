import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(100),
  startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date/time",
  }),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
});

export type EventInput = z.infer<typeof eventSchema>;
