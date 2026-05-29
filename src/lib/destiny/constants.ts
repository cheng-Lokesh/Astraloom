import type {
  EarthlyBranch,
  FiveElement,
  HeavenlyStem,
  TenGodName,
  YinYang,
} from "@/types/destiny";

export const HEAVENLY_STEMS = [
  "jia",
  "yi",
  "bing",
  "ding",
  "wu",
  "ji",
  "geng",
  "xin",
  "ren",
  "gui",
] as const satisfies readonly HeavenlyStem[];

export const EARTHLY_BRANCHES = [
  "zi",
  "chou",
  "yin",
  "mao",
  "chen",
  "si",
  "wu",
  "wei",
  "shen",
  "you",
  "xu",
  "hai",
] as const satisfies readonly EarthlyBranch[];

export const FIVE_ELEMENTS = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
] as const satisfies readonly FiveElement[];

export const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  jia: "wood",
  yi: "wood",
  bing: "fire",
  ding: "fire",
  wu: "earth",
  ji: "earth",
  geng: "metal",
  xin: "metal",
  ren: "water",
  gui: "water",
};

export const STEM_YIN_YANG: Record<HeavenlyStem, YinYang> = {
  jia: "yang",
  yi: "yin",
  bing: "yang",
  ding: "yin",
  wu: "yang",
  ji: "yin",
  geng: "yang",
  xin: "yin",
  ren: "yang",
  gui: "yin",
};

export const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  zi: "water",
  chou: "earth",
  yin: "wood",
  mao: "wood",
  chen: "earth",
  si: "fire",
  wu: "fire",
  wei: "earth",
  shen: "metal",
  you: "metal",
  xu: "earth",
  hai: "water",
};

export const BRANCH_YIN_YANG: Record<EarthlyBranch, YinYang> = {
  zi: "yang",
  chou: "yin",
  yin: "yang",
  mao: "yin",
  chen: "yang",
  si: "yin",
  wu: "yang",
  wei: "yin",
  shen: "yang",
  you: "yin",
  xu: "yang",
  hai: "yin",
};

export const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  zi: ["gui"],
  chou: ["ji", "gui", "xin"],
  yin: ["jia", "bing", "wu"],
  mao: ["yi"],
  chen: ["wu", "yi", "gui"],
  si: ["bing", "geng", "wu"],
  wu: ["ding", "ji"],
  wei: ["ji", "ding", "yi"],
  shen: ["geng", "ren", "wu"],
  you: ["xin"],
  xu: ["wu", "xin", "ding"],
  hai: ["ren", "jia"],
};

export const MONTH_BRANCH_ORDER = [
  "yin",
  "mao",
  "chen",
  "si",
  "wu",
  "wei",
  "shen",
  "you",
  "xu",
  "hai",
  "zi",
  "chou",
] as const satisfies readonly EarthlyBranch[];

export const TEN_GODS = [
  "friend",
  "rob_wealth",
  "eating_god",
  "hurting_officer",
  "indirect_wealth",
  "direct_wealth",
  "seven_killings",
  "direct_officer",
  "indirect_resource",
  "direct_resource",
] as const satisfies readonly TenGodName[];

export const TEN_GOD_LANGUAGE: Record<TenGodName, string> = {
  friend: "self-rhythm signal",
  rob_wealth: "shared-resource signal",
  eating_god: "steady expression signal",
  hurting_officer: "direct expression signal",
  indirect_wealth: "flexible resource signal",
  direct_wealth: "structured resource signal",
  seven_killings: "boundary pressure signal",
  direct_officer: "role and responsibility signal",
  indirect_resource: "uncertain information signal",
  direct_resource: "supporting information signal",
};

export const GENERATES: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

export const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export const STEM_LABEL: Record<HeavenlyStem, string> = {
  jia: "Jia wood",
  yi: "Yi wood",
  bing: "Bing fire",
  ding: "Ding fire",
  wu: "Wu earth",
  ji: "Ji earth",
  geng: "Geng metal",
  xin: "Xin metal",
  ren: "Ren water",
  gui: "Gui water",
};

export const BRANCH_LABEL: Record<EarthlyBranch, string> = {
  zi: "Zi",
  chou: "Chou",
  yin: "Yin",
  mao: "Mao",
  chen: "Chen",
  si: "Si",
  wu: "Wu",
  wei: "Wei",
  shen: "Shen",
  you: "You",
  xu: "Xu",
  hai: "Hai",
};
