// 수행 이력의 수 — 판이 화면에 들어올 때 0 에서 세어 올린다(사령관 2026-09-08 "숫자가 늘어나면서
// 성장하고 있구나 느낌"). 세는 건 수량뿐이다 — 연도(2022 · 2003)는 데이터에서 data-count 를
// 달지 않는다. 연도를 0 부터 세면 늘어난 적 없는 것이 늘어난 것처럼 읽힌다.
// 한 번만 돈다. reduced-motion 이면 최종값 그대로 두고 아무것도 하지 않는다.
const DUR = 1400;

export function initCounters() {
  const nodes = [...document.querySelectorAll("[data-count]")];
  if (!nodes.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 숫자 노드만 바꾼다 — 단위 첨자(<span>)는 마크업 그대로 둔다.
  const numText = (el) => [...el.childNodes].find((n) => n.nodeType === 3);

  const run = (el) => {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) return;
    const text = numText(el);
    if (!text) return;
    const write = (v) => (text.nodeValue = String(v));
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / DUR);
      // 끝에서 감속 — 마지막 한 자리가 천천히 멎어야 "도달"로 읽힌다.
      const eased = 1 - (1 - p) ** 3;
      write(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    write(0);
    requestAnimationFrame(step);
  };

  // 낱장이 아니라 판 단위로 센다. 숫자마다 따로 걸면 맨 아래 칸이 화면 밑선에 걸치는 순간
  // 그 숫자만 먼저 돌아 흩어지고, 스크롤이 빠르면 눈이 닿을 때는 이미 끝나 있다.
  // 판이 화면 아래 15% 선을 넘어 들어왔을 때 여섯이 같이 오른다.
  const boards = new Set(nodes.map((n) => n.closest(".bento") ?? n));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        for (const n of e.target.querySelectorAll?.("[data-count]") ?? []) run(n);
        if (e.target.matches("[data-count]")) run(e.target);
      }
    },
    { threshold: 0.25, rootMargin: "0px 0px -15% 0px" },
  );
  for (const b of boards) io.observe(b);
}
