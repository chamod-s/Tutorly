import { z } from 'zod';

// ─── Submit Application ───────────────────────────────────────

export const submitApplicationSchema = z.object({
  body: z.object({
    bio: z.string().min(50, 'Bio must be at least 50 characters').max(2000),
    subjects: z
      .string()
      .transform((val) => {
        try { return JSON.parse(val) as string[]; } catch { return val.split(',').map((s) => s.trim()); }
      })
      .pipe(z.array(z.string().min(1)).min(1, 'At least one subject is required').max(10)),
    qualifications: z
      .string()
      .transform((val) => {
        try { return JSON.parse(val) as string[]; } catch { return val.split(',').map((s) => s.trim()); }
      })
      .pipe(z.array(z.string().min(1)).min(1, 'At least one qualification is required')),
    experience: z.string().transform(Number).pipe(z.number().min(0).max(50)),
  }),
});

export type SubmitApplicationDto = z.infer<typeof submitApplicationSchema>['body'];

// ─── Reject Teacher ───────────────────────────────────────────

export const rejectTeacherSchema = z.object({
  body: z.object({
    reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  }),
});

export type RejectTeacherDto = z.infer<typeof rejectTeacherSchema>['body'];
