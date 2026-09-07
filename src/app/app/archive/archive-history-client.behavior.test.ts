import { beforeEach, describe, expect, it, vi } from "vitest";

const state=vi.hoisted(()=>({stateCalls:0}));
const completedId="completed-run";
const historyPayload=[
  {id:"draft-run",status:"draft"},
  {id:"queued-run",status:"queued"},
  {id:"running-run",status:"running"},
  {id:completedId,status:"completed"},
  {id:"blocked-run",status:"blocked"},
  {id:"failed-run",status:"failed"},
];

vi.mock("react",async(importOriginal)=>{const actual=await importOriginal<typeof import("react")>();return{...actual,useCallback:<T,>(callback:T)=>callback,useEffect:()=>undefined,useState:<T,>(initial:T)=>[state.stateCalls++===0?historyPayload as T:initial,vi.fn()]};});
vi.mock("@/components/app-shell",()=>({AppShell:({children}: {children:unknown})=>children}));
vi.mock("@/components/ui-foundation",()=>({Button:()=>null,ButtonLink:()=>null,SurfaceCard:({children}: {children:unknown})=>children}));
vi.mock("@/lib/formal-sandbox/client",()=>({createFormalSandboxClient:()=>({history:vi.fn()})}));

import { ArchiveHistoryClient } from "./archive-history-client";

type Element={props?:{children?:unknown;href?:string;className?:string}};
function descendants(node:unknown,found:Element[]=[]):Element[]{if(Array.isArray(node)){for(const child of node)descendants(child,found);return found}if(node&&typeof node==="object"&&"props" in node){const element=node as Element;found.push(element);descendants(element.props?.children,found)}return found}
function text(node:unknown):string{if(Array.isArray(node))return node.map(text).join("");if(typeof node==="string")return node;if(node&&typeof node==="object"&&"props" in node)return text((node as Element).props?.children);return ""}

describe("ArchiveHistoryClient completed-result boundary",()=>{
  beforeEach(()=>{state.stateCalls=0});

  it("does not render a completion badge or Result link for five non-completed statuses in an unexpected History payload",()=>{
    const elements=descendants(ArchiveHistoryClient({timeUnavailableLabel:"time unavailable"}));
    const resultLinks=elements.filter((element)=>element.props?.href?.startsWith("/app/simulation/result?run_id="));
    const completionBadges=elements.filter((element)=>element.props?.className?.includes("text-[var(--verified-green)]"));

    expect(resultLinks).toHaveLength(1);
    expect(resultLinks.map((element)=>element.props?.href)).toEqual([`/app/simulation/result?run_id=${completedId}`]);
    expect(completionBadges.map(text)).toEqual(["completed"]);
  });
});
