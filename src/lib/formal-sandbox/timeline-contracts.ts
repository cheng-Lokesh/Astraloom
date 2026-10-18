import { z } from "zod";

// Browser-safe contract: no runtime, replay, Core, or server imports belong here.
const unsafeText = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+scenario|trace(?:[_ -]?id)?|internal(?:[_ -]?key|\s+evidence\s+ref)?|token|secret|password|api[_ -]?key|private\s+key|bearer)\b|[a-z]:[\\/]|(?:^|\s)\/(?:[a-z0-9_.-]+\/)+|(?:https?|file):\/\/|(?:world_event_v2_|agent_definition_v2_|world_resource_v2_|world_variable_v2_|world_relation_v2_|trajectory_v2_|transition_command_v2_)/i;
const text = z.string().trim().min(1).max(2_000).refine(value => !unsafeText.test(value));
const ordinal = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-[1-9]\\d*$`));
const value = z.union([text, z.number().finite(), z.null()]);
const event = z.object({
  stepKey: ordinal("step"),
  label: text,
  kind: z.enum(["commitment", "resource", "relationship_response", "environment", "information_request"]),
  participantKeys: z.array(ordinal("person")).max(50),
  relationshipKeys: z.array(ordinal("relation")).max(200),
  changes: z.array(z.object({
    kind: z.enum(["resource", "relationship", "environment", "commitment", "information_request"]),
    label: text, before: value, after: value, unit: text.nullable(),
  }).strict()).max(16),
  causes: z.object({
    priorStepKeys: z.array(ordinal("step")).max(6),
    factKeys: z.array(ordinal("fact")).max(200),
    assumptionKeys: z.array(ordinal("assumption")).max(200),
    ruleKeys: z.array(ordinal("rule")).max(18).optional(),
    unrecorded: z.boolean(),
  }).strict(),
  claimKeys: z.array(ordinal("claim")).max(100),
}).strict();

export const safeSimulationTimelineSchema = z.object({
  version: z.literal("formal-simulation-timeline-v1"),
  samples: z.array(z.object({
    key: z.string().regex(/^sample-[1-3]$/),
    terminalStatus: z.enum(["completed", "no_actions"]),
    ticks: z.array(z.object({
      tickIndex: z.number().int().min(0).max(5),
      occurredAt: z.string().datetime({ offset: true }).nullable(),
      status: z.enum(["event", "no_actions", "not_reached"]),
      event: event.nullable(),
    }).strict().superRefine((tick, ctx) => {
      if ((tick.status === "event") !== (tick.event !== null) || (tick.status === "not_reached") !== (tick.occurredAt === null)) ctx.addIssue({ code: "custom", message: "Timeline status requires its recorded time and Event." });
    })).min(3).max(6),
  }).strict()).length(3),
}).strict();

export type SafeSimulationTimeline = z.infer<typeof safeSimulationTimelineSchema>;
