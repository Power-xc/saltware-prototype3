import { initAnalytics } from "./analytics.mjs?v=8386ba1d3d3a";
import { initNav } from "./nav.mjs?v=8386ba1d3d3a";
import { initReveal } from "./reveal.mjs?v=8386ba1d3d3a";
import { initFaq, initCaseFilter, initFooterGroups } from "./disclosure.mjs?v=8386ba1d3d3a";
import { initAttribution } from "./attribution.mjs?v=8386ba1d3d3a";

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
  import("./contact-form.mjs?v=8386ba1d3d3a").then(({ initContactForm }) => initContactForm()),
);
when("[data-hcards]", () =>
  import("./hero-object.mjs?v=8386ba1d3d3a").then(({ initHeroObject }) => initHeroObject()),
);
when("[data-newsletter-form]", () =>
  import("./newsletter.mjs?v=8386ba1d3d3a").then(({ initNewsletter }) => initNewsletter()),
);
when("[data-bunav]", () => import("./bunav.mjs?v=8386ba1d3d3a").then(({ initBunav }) => initBunav()));
when("[data-rail]", () => import("./rail.mjs?v=8386ba1d3d3a").then(({ initRails }) => initRails()));
when("[data-filter]", () => import("./filters.mjs?v=8386ba1d3d3a").then(({ initFilters }) => initFilters()));
when("[data-count]", () => import("./counter.mjs?v=8386ba1d3d3a").then(({ initCounters }) => initCounters()));
when("[data-paged]", () => import("./pager.mjs?v=8386ba1d3d3a").then(({ initPagers }) => initPagers()));
when("[data-year-stage]", () =>
  import("./year-stage.mjs?v=8386ba1d3d3a").then(({ initYearStage }) => initYearStage()),
);
when("[data-pillars]", () =>
  import("./pillars.mjs?v=8386ba1d3d3a").then(({ initPillars }) => initPillars()),
);
when("[data-stage]", () => import("./stage.mjs?v=8386ba1d3d3a").then(({ initStage }) => initStage()));
when("[data-parallax]", () => import("./parallax.mjs?v=8386ba1d3d3a").then(({ initParallax }) => initParallax()));
when("video[data-ambient]", () =>
  import("./ambient-video.mjs?v=8386ba1d3d3a").then(({ initAmbientVideo }) => initAmbientVideo()),
);
when("[data-spot]", () => import("./spot.mjs?v=8386ba1d3d3a").then(({ initSpot }) => initSpot()));
when("[data-reel]", () => import("./reel.mjs?v=8386ba1d3d3a").then(({ initReels }) => initReels()));
when("[data-intro]", () => import("./intro.mjs?v=8386ba1d3d3a").then(({ initIntro }) => initIntro()));

