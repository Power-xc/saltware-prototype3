// 사업 상세의 지면 내 탭 — "지금 읽는 자리" 표시.
//
// 건너뛰기 자체는 앵커라 JS 없이 된다(partials/blocks-nav.mjs). 여기서 하는 일은
// 읽고 있는 섹션의 탭에 표시를 옮기는 것뿐이고, 못 내려와도 탭은 그대로 쓸 수 있다.
//
// 관찰 창을 화면 위쪽 한 줄로 좁힌다(rootMargin). 섹션이 화면보다 길어서 "보이는
// 섹션"으로 재면 둘이 동시에 걸리고 표시가 떤다. 붙박이 탭 줄 바로 밑을 기준선으로
// 삼으면 그 선을 지나는 섹션이 언제나 하나다.
export function initBunav() {
  const nav = document.querySelector("[data-bunav]");
  if (!nav || typeof IntersectionObserver !== "function") return;

  const links = [...nav.querySelectorAll(".bnav__link")];
  const byId = new Map(
    links.map((a) => [decodeURIComponent(a.getAttribute("href").slice(1)), a]),
  );
  const targets = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!targets.length) return;

  const mark = (id) => {
    for (const a of links) a.classList.remove("is-here");
    byId.get(id)?.classList.add("is-here");
  };

  // 기준선 위를 지난 것 중 가장 아래 것이 "지금 읽는 자리"다.
  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target.id);
        else seen.delete(e.target.id);
      }
      const here = targets.filter((t) => seen.has(t.id)).at(-1);
      if (here) mark(here.id);
    },
    { rootMargin: "-72px 0px -85% 0px", threshold: 0 },
  );
  for (const t of targets) io.observe(t);
}
