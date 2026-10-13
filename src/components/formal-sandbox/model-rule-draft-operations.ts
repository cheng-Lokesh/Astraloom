import type { DigitalLifeRules } from "@/lib/digital-life/model";
import type { DigitalLifeRulesDraft, SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";
import type { EditorDraft } from "./digital-life-rules-editor";

export type DraftAction = Omit<DigitalLifeRulesDraft["actions"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type DraftStrategy = Omit<DigitalLifeRulesDraft["strategies"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type RevisionDraft = Omit<DigitalLifeRulesDraft, "actions" | "strategies"> & { actions: DraftAction[]; strategies: DraftStrategy[] };
export type DraftSource = Pick<SafeDigitalLifeCorrectionContext, "modelContext" | "horizonDays">;
export type DraftSelection = { kind: "action"; key: string } | { kind: "strategy"; participantKey: string };
export type DraftValidation = { ok: true } | { ok: false; message: string; invalidActionKeys: string[] };
export type DraftOperationResult = { ok: true; draft: RevisionDraft; resetPermissions: boolean; invalidActionKeys: string[]; message?: string; addedActionKey?: string } | { ok: false; message: string };

// Fail closed until the named mutation guarantees have a validated RED checkpoint.
const pending = (): DraftOperationResult => ({ ok: false, message: "草稿操作尚未完成，请保留当前内容。" });
export function addDraftAction(source: DraftSource, draft: RevisionDraft, editor: EditorDraft, usedRuleKeys: readonly string[] = []): DraftOperationResult { void [source, draft, editor, usedRuleKeys]; return pending(); }
export function updateDraftAction(source: DraftSource, draft: RevisionDraft, key: string, patch: Partial<Omit<DraftAction, "key">>): DraftOperationResult { void [source, draft, key, patch]; return pending(); }
export function setDraftActionConfirmation(source: DraftSource, draft: RevisionDraft, key: string, confirmed: boolean): DraftOperationResult { void [source, draft, key, confirmed]; return pending(); }
export function addDraftStrategy(source: DraftSource, draft: RevisionDraft, strategy: Omit<DraftStrategy, "confirmedForSimulation">): DraftOperationResult { void [source, draft, strategy]; return pending(); }
export function updateDraftStrategy(source: DraftSource, draft: RevisionDraft, key: string, patch: Partial<Omit<DraftStrategy, "participantKey">>): DraftOperationResult { void [source, draft, key, patch]; return pending(); }
export function setDraftStrategyConfirmation(source: DraftSource, draft: RevisionDraft, key: string, confirmed: boolean): DraftOperationResult { void [source, draft, key, confirmed]; return pending(); }
export function previewDraftRemoval(draft: RevisionDraft, selection: DraftSelection): { actionKeys: string[]; strategyKeys: string[] } { void [draft, selection]; return { actionKeys: [], strategyKeys: [] }; }
export function removeDraftSelection(source: DraftSource, draft: RevisionDraft, selection: DraftSelection, confirmed: boolean): DraftOperationResult { void [source, draft, selection, confirmed]; return pending(); }
export function validateRevisionDraft(source: DraftSource, draft: RevisionDraft): DraftValidation { void [source, draft]; return { ok: false, message: "请检查草稿。", invalidActionKeys: [] }; }
export function confirmedDraftRules(source: DraftSource, draft: RevisionDraft): DigitalLifeRules | null { void [source, draft]; return null; }
export function normalizeDraftForSave(source: DraftSource, draft: RevisionDraft): DigitalLifeRulesDraft | null { void [source, draft]; return null; }
