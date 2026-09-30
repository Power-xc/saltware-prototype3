import { initAnalytics } from "./analytics.mjs?v=10ba0c3717a7";
import { initNav } from "./nav.mjs?v=10ba0c3717a7";
import { initReveal } from "./reveal.mjs?v=10ba0c3717a7";
import { initFaq, initCaseFilter, initFooterGroups } from "./disclosure.mjs?v=10ba0c3717a7";
import { initAttribution } from "./attribution.mjs?v=10ba0c3717a7";

// 초기화 하나가 던져도 나머지는 산다 — 첫 화면 스크립트는 서로 독립이다.
const run = (name, init) => {
  try {
    init();
  } catch (e) {
    console.warn(`${name} failed:`, e);
  }
};
run("Analytics", initAnalytics);
run("Nav", initNav);
run("Reveal", initReveal);
run("FAQ", initFaq);
run("Case filter", initCaseFilter);
run("Footer groups", initFooterGroups);
run("Attribution", initAttribution);

// 그 지면에 요소가 있을 때만 모듈을 내려받는다 — 홈의 무대 스크립트를 문의 지면이 지지 않는다.
// await 로 줄 세우지 않는다: 하나가 느리다고 다음 모듈이 기다릴 이유가 없다.
const when = (sel, load) => {
  if (!document.querySelector(sel)) return;
  load().catch((e) => console.warn(`${sel} init failed:`, e));
};
when("[data-contact-form]", () =>
  import("./contact-form.mjs?v=10ba0c3717a7").then(({ initContactForm }) => initContactForm()),
);
when("[data-hcards]", () =>
  import("./hero-object.mjs?v=10ba0c3717a7").then(({ initHeroObject }) => initHeroObject()),
);
when("[data-newsletter-form]", () =>
  import("./newsletter.mjs?v=10ba0c3717a7").then(({ initNewsletter }) => initNewsletter()),
);
when("[data-bunav]", () => import("./bunav.mjs?v=10ba0c3717a7").then(({ initBunav }) => initBunav()));
when("[data-rail]", () => import("./rail.mjs?v=10ba0c3717a7").then(({ initRails }) => initRails()));
when("[data-filter]", () => import("./filters.mjs?v=10ba0c3717a7").then(({ initFilters }) => initFilters()));
when("[data-count]", () => import("./counter.mjs?v=10ba0c3717a7").then(({ initCounters }) => initCounters()));
when("[data-paged]", () => import("./pager.mjs?v=10ba0c3717a7").then(({ initPagers }) => initPagers()));
when("[data-year-stage]", () =>
  import("./year-stage.mjs?v=10ba0c3717a7").then(({ initYearStage }) => initYearStage()),
);
when("[data-pillars]", () =>
  import("./pillars.mjs?v=10ba0c3717a7").then(({ initPillars }) => initPillars()),
);
when("[data-scrollcord]", () =>
  import("./scrollcord.mjs?v=10ba0c3717a7").then(({ initScrollcord }) => initScrollcord()),
);
when("[data-stage]", () => import("./stage.mjs?v=10ba0c3717a7").then(({ initStage }) => initStage()));
when("[data-parallax]", () => import("./parallax.mjs?v=10ba0c3717a7").then(({ initParallax }) => initParallax()));
when("video[data-ambient]", () =>
  import("./ambient-video.mjs?v=10ba0c3717a7").then(({ initAmbientVideo }) => initAmbientVideo()),
);
when("[data-spot]", () => import("./spot.mjs?v=10ba0c3717a7").then(({ initSpot }) => initSpot()));
when("[data-reel]", () => import("./reel.mjs?v=10ba0c3717a7").then(({ initReels }) => initReels()));
when("[data-intro]", () => import("./intro.mjs?v=10ba0c3717a7").then(({ initIntro }) => initIntro()));
when("[data-preview]", () =>
  import("./ir-preview.mjs?v=10ba0c3717a7").then(({ initIrPreview }) => initIrPreview()),
);

