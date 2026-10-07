import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { projectDefaultPlanning, safeDefaultPlanningSchema } from "@/lib/formal-planning/projection";
import { planningRequest, planningSource } from "@/lib/formal-planning/test-fixtures";
import { formalSandboxResultProjectionSchema } from "@/lib/formal-sandbox/client";
import { EvidenceWorkbenchView, initialFeedbackState, initialTargetedFeedbackState } from "./result-workbench";

it("shows the legally frozen planner budget and initial hypothesis as simulation assumptions",()=>{
 const frozen=freezeDefaultPlanning(planningRequest(),planningSource());
 expect(frozen.ok).toBe(true);if(!frozen.ok)return;
 const defaultPlanning=safeDefaultPlanningSchema.parse(projectDefaultPlanning(frozen.planning));
 const projection={...formalSandboxResultProjectionSchema.parse({participants:[],relationships:[],facts:[],assumptions:[],steps:[],claims:[],resourceChanges:[],realityProfile:{status:"not_recorded",revision:null,facts:[],assumptions:[],unknowns:[],structuredResources:[],structuredConstraints:[],worldVariables:[]}}),defaultPlanning};
 const noop=()=>{};
 const html=renderToStaticMarkup(createElement(EvidenceWorkbenchView,{projection,selectedClaimKey:null,onChooseClaim:noop,feedbackState:initialFeedbackState,onCommentChange:noop,onSaveFeedback:noop,targetFeedbackTarget:null,targetFeedbackState:initialTargetedFeedbackState,targetFeedbackSaving:false,onChooseFeedbackTarget:noop,onTargetRatingChange:noop,onTargetCommentChange:noop,onSaveTargetFeedback:noop}));
 for(const label of ["本次冻结的默认规划","整次模拟预算上限","首轮候选用量","关系影响尚未实现"])expect(html.includes(label)).toBe(true);
 expect(html.includes(frozen.planning.sourceBinding.ownerId)).toBe(false);
 expect(html.includes(frozen.planning.fusion.provenance?.snapshotId??"never-visible")).toBe(false);
});
