"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

const sampleBirthInfo = {
  birthDate: "1992-08-16",
  birthTime: "07:40",
  birthPlace: "Shanghai",
  gender: "not_specified",
};

const sampleDescription =
  "I have been torn for two months about whether to accept a higher-paying new role or stay with my current team for a promised promotion. My current manager controls promotion timing, the recruiter is asking for an answer next week, and a trusted colleague hinted that budget approval may be slower than expected. I want Astraloom to map the pressure between timing, trust, opportunity, and reputation without treating anyone's private motives as certain.";

function firstQuestion(description: string) {
  const match = description.match(/[^.!?\n]*\?+/);
  if (match?.[0]?.trim()) return match[0].trim();

  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= 140) return normalized;

  return `${normalized.slice(0, 137).trim()}...`;
}

function destinyBirthInfoText(birthInfo: BirthInfo, mode: DestinyMode) {
  if (mode === "skipped") return "Destiny context skipped by user.";

  return [
    birthInfo.birthDate ? `Birth date: ${birthInfo.birthDate}` : "",
    birthInfo.birthTime ? `Birth time: ${birthInfo.birthTime}` : "Birth time: unknown",
    birthInfo.birthPlace ? `Birth place: ${birthInfo.birthPlace}` : "",
    birthInfo.gender ? `Gender: ${birthInfo.gender}` : "",
    birthInfo.timezone ? `Timezone: ${birthInfo.timezone}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function seedFromStartInput({
  id,
  birthInfo,
  mode,
  description,
  timeWindow,
  createdAt,
}: {
  id: string;
  birthInfo: BirthInfo;
  mode: DestinyMode;
  description: string;
  timeWindow: TimeWindow;
  createdAt: string;
}): SeedContextDraft {
  const now = new Date().toISOString();
  const questionText = firstQuestion(description);
  const destinyText = destinyBirthInfoText(birthInfo, mode);

  return {
    id,
    questionText,
    trackType:
      timeWindow === "30_days" || timeWindow === "90_days"
        ? "crossroad"
        : "life_climate",
    timeWindow,
    destinyBirthInfo: destinyText,
    currentQuestionDescription: description.trim(),
    situationSummary: `${destinyText}\n\nCurrent question description: ${description.trim()}`,
    recentEvents: description.trim(),
    recentEventsText: description.trim(),
    keyPeopleText: "",
    decisionOptions: description.trim(),
    decisionOptionsText: description.trim(),
    worries: "",
    forbiddenActions:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    forbiddenActionsText:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    safetyBoundaries:
      "Use destiny context as symbolic climate only; keep findings evidence-backed and non-deterministic.",
    desiredOutput:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    desiredOutputText:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    contextQualityScore:
      mode === "full" && description.trim().length >= 160
        ? 82
        : description.trim().length >= 80
          ? 68
          : 42,
    missingContextHints:
      mode === "full"
        ? []
        : [
            "Destiny context is directional. A later clarification page can ask one to three optional follow-ups.",
          ],
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
    createdAt,
    updatedAt: now,
  };
}

export default function StartPage() {
  const router = useRouter();
  const [repos] = useState(() => getRepositories());
  const [initialSeed] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("not_specified");
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [skipDestiny, setSkipDestiny] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialSeed?.timeWindow ?? "90_days",
  );
  const [description, setDescription] = useState(
    initialSeed?.currentQuestionDescription ?? initialSeed?.situationSummary ?? "",
  );
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const birthInfo = useMemo<BirthInfo>(
    () =>
      skipDestiny
        ? {}
        : {
            birthDate: birthDate.trim() || undefined,
            birthTime:
              unknownBirthTime || skipDestiny ? undefined : birthTime.trim() || undefined,
            birthPlace: birthPlace.trim() || undefined,
            gender: gender === "not_specified" ? undefined : gender,
          },
    [birthDate, birthPlace, birthTime, gender, skipDestiny, unknownBirthTime],
  );
  const previewProfile = useMemo(
    () => buildDestinyProfileDraft({ birthInfo, seedContextId: "preview_seed" }),
    [birthInfo],
  );
  const canSubmit =
    description.trim().length >= 20 && (skipDestiny || birthDate.trim().length > 0);

  function fillSample() {
    setBirthDate(sampleBirthInfo.birthDate);
    setBirthTime(sampleBirthInfo.birthTime);
    setBirthPlace(sampleBirthInfo.birthPlace);
    setGender(sampleBirthInfo.gender);
    setUnknownBirthTime(false);
    setSkipDestiny(false);
    setTimeWindow("90_days");
    setDescription(sampleDescription);
    setMessage("Complete sample loaded. Generate it when you are ready.");
  }

  function submit() {
    if (saving) return;

    if (!skipDestiny && !birthDate.trim()) {
      setMessage("Add a birth date, or choose Skip destiny for this run.");
      return;
    }

    if (description.trim().length < 20) {
      setMessage("Add one current question or situation description before generating.");
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const seedContextId = initialSeed?.id ?? repos.seedContexts.createId();
    const profile = buildDestinyProfileDraft({
      birthInfo,
      seedContextId,
      now,
    });
    const seedContext = seedFromStartInput({
      id: seedContextId,
      birthInfo,
      mode: profile.mode,
      description,
      timeWindow,
      createdAt: initialSeed?.createdAt ?? now,
    });
    const climate = buildDestinyClimateDraft({
      profile,
      referenceDate: now,
      timeWindow,
      topic: description,
    });
    const readiness = evaluateSandboxReadiness({
      seedContext,
      birthInfo,
      destinyProfile: profile,
      maxQuestions: 3,
    });
    setSafetyDecision(readiness.safetyDecision);

    if (readiness.readiness === "blocked") {
      setSaving(false);
      setMessage(readiness.safetyDecision.userMessage);
      return;
    }

    const seedResult = repos.seedContexts.save(seedContext);
    const profileResult = repos.destinyProfiles.save(profile);
    const climateResult = repos.destinyClimates.save(climate);

    if (!seedResult.ok || !profileResult.ok || !climateResult.ok) {
      setSaving(false);
      setMessage("Local save failed. Please try again.");
      return;
    }

    if (readiness.readiness === "needs_clarification") {
      router.push("/app/start/clarify");
      return;
    }

    const sandboxResult = prepareLocalSandboxArtifacts(seedContext);
    if (!sandboxResult.ok) {
      setSaving(false);
      setMessage(`Local sandbox preparation failed: ${sandboxResult.errorCode}`);
      return;
    }

    router.push("/app/simulation/running");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">Destiny-situation start</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
            Enter your birth context and current question.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            Astraloom maps destiny climate, real people, and possible paths into
            a dynamic sandbox. Birth context is used as symbolic climate, not as
            deterministic fate.
          </p>
        </SurfaceCard>

        {message ? (
          <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
            {message}
          </p>
        ) : null}
        {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Safety check before sandbox generation"
          />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <SurfaceCard className="p-6">
            <div className="space-y-7">
              <section>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#11150f]">
                      Birth context
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">
                      Add what you know. Unknown time is fine, and you can skip
                      the destiny layer for this run.
                    </p>
                  </div>
                  <span className="rounded-md border border-black/8 bg-[#f7f8f4] px-3 py-2 text-xs font-semibold uppercase text-[#62695d]">
                    {previewProfile.mode}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={skipDestiny ? "primary" : "secondary"}
                    onClick={() => setSkipDestiny((value) => !value)}
                  >
                    {skipDestiny ? "Destiny skipped" : "Skip destiny"}
                  </Button>
                  <Button
                    type="button"
                    variant={unknownBirthTime ? "primary" : "secondary"}
                    onClick={() => {
                      setUnknownBirthTime((value) => !value);
                      setBirthTime("");
                    }}
                    disabled={skipDestiny}
                  >
                    Unknown exact time
                  </Button>
                </div>

                {!skipDestiny ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Birth date">
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(event) => setBirthDate(event.target.value)}
                        className="mf-input w-full px-3 py-2"
                      />
                    </Field>
                    <Field label="Birth time">
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(event) => setBirthTime(event.target.value)}
                        disabled={unknownBirthTime}
                        className="mf-input w-full px-3 py-2 disabled:opacity-50"
                      />
                    </Field>
                    <Field label="Birth place">
                      <input
                        value={birthPlace}
                        onChange={(event) => setBirthPlace(event.target.value)}
                        placeholder="City or place, optional"
                        className="mf-input w-full px-3 py-2"
                      />
                    </Field>
                    <Field label="Gender">
                      <div className="flex flex-wrap gap-2">
                        {["not_specified", "female", "male"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setGender(value)}
                            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                              gender === value
                                ? "border-[#11150f] bg-[#11150f] text-white"
                                : "border-black/10 bg-white text-[#52594d]"
                            }`}
                          >
                            {value === "not_specified" ? "Skip" : value}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                ) : null}
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#11150f]">
                  Current question
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">
                  Use one natural description. Include people, recent events,
                  options, worries, or boundaries only if they naturally matter.
                </p>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={9}
                  placeholder="Example: I have been torn for two months about changing jobs. My manager promised a promotion but gave no date, a recruiter wants an answer next week, and I want to understand the pressure between timing, trust, and opportunity."
                  className="mf-input mt-4 w-full resize-none px-4 py-3 leading-7"
                />
              </section>

              <section>
                <h2 className="text-sm font-semibold text-[#11150f]">
                  Sandbox window
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["30_days", "90_days", "1_year", "3_years", "5_years"] as TimeWindow[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTimeWindow(value)}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                          timeWindow === value
                            ? "border-[#11150f] bg-[#11150f] text-white"
                            : "border-black/10 bg-white text-[#52594d]"
                        }`}
                      >
                        {value.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={submit} disabled={!canSubmit || saving}>
                  Generate destiny sandbox
                </Button>
                <TrialSampleButton
                  target="/app/simulation/result"
                  className="mf-button mf-button-secondary px-5 py-3"
                >
                  Try a complete destiny sandbox sample
                </TrialSampleButton>
                <Button type="button" variant="secondary" onClick={fillSample}>
                  Fill sample fields
                </Button>
              </div>
            </div>
          </SurfaceCard>

          <aside className="h-fit space-y-4">
            <section className="mf-panel-dark p-6">
              <h2 className="text-sm font-semibold text-[#b7e6c6]">
                What gets saved locally
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/66">
                <p>Destiny Profile: {previewProfile.mode} mode.</p>
                <p>Destiny Climate: built from the selected window and question.</p>
                <p>Seed Context: derived from the single free-form description.</p>
              </div>
            </section>
            <section className="mf-card p-5">
              <h2 className="text-sm font-semibold text-[#11150f]">
                Product boundary
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">
                This flow does not create a fortune report, professional advice,
                payment, production write, or service-role operation.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
