// 산업 머리 무대([data-reel]) — 탭 하나가 장면 하나를 켠다(partials/industry-banner.mjs).
//
// 차례가 도는 동안 켜진 탭의 선이 왼쪽에서 차오르고, 다 차면 다음 장면이다. 손이 닿으면
// 그 탭에 멈추고, 손을 떼면 거기서 다시 돈다. 화면 밖이면 영상도 차례도 멈춘다.
// 한 번에 도는 영상은 하나뿐이다 — 꺼진 장면은 pause 하고, 처음 켜질 때에야 받는다.
//
// 없어도 되는 기능이다: 스크립트가 없으면 첫 장면이 autoplay 로 돌고 탭은 그냥 링크다.
// prefers-reduced-motion 이면 영상을 틀지 않고(포스터 한 장) 차례도 돌리지 않는다 —
// 탭에 손이 닿으면 장면(포스터)만 바뀐다.

const DWELL = 6500;

function setup(reel, still) {
  const films = [...reel.querySelectorAll("[data-reel-film]")];
  const tabs = [...reel.querySelectorAll("[data-reel-tab]")];
  let at = 0;
  let timer = 0;
  let seen = false;
  let held = false;

  const sync = () => {
    films.forEach((f, i) => {
      if (f.tagName !== "VIDEO") return;
      if (i === at && seen && !still) {
        f.preload = "auto";
        f.play().catch(() => {});
      } else f.pause();
    });
  };

  // 선이 차오르는 애니메이션은 클래스를 뗐다 붙여야 처음부터 다시 돈다.
  const arm = () => {
    clearTimeout(timer);
    reel.classList.remove("is-running");
    if (still || held || !seen || films.length < 2) return;
    void reel.offsetWidth;
    reel.classList.add("is-running");
    timer = setTimeout(() => show(at + 1), DWELL);
  };

  function show(n) {
    at = (n + films.length) % films.length;
    films.forEach((f, i) => f.classList.toggle("is-on", i === at));
    tabs.forEach((t, i) => t.classList.toggle("is-on", i === at));
    sync();
    arm();
  }

  const hold = (i) => {
    held = true;
    show(i);
  };
  const release = () => {
    held = false;
    arm();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("pointerenter", () => hold(i));
    t.addEventListener("focus", () => hold(i));
  });
  reel.addEventListener("pointerleave", release);
  reel.addEventListener("focusout", (e) => {
    if (!reel.contains(e.relatedTarget)) release();
  });

  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    sync();
    arm();
  }).observe(reel);
}

export function initReels() {
  const reels = [...document.querySelectorAll("[data-reel]")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const reel of reels) {
    reel.style.setProperty("--reel-dwell", `${DWELL}ms`);
    if (still) {
      for (const v of reel.querySelectorAll("video")) {
        v.removeAttribute("autoplay");
        v.pause();
      }
    }
    setup(reel, still);
  }
}
