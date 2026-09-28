// 사업 기둥 목록 — 지금 읽는 줄 하나를 골라 왼쪽 붙박이 액자와 짝짓는다
// (company.css 의 "사업 기둥" 구획, toss.im/company 의 문화 목록 판).
//
// 누가 활성인가: 화면 위에서 42% 지점에 그은 가상의 선을 지나는 줄이다. 가운데(50%)가
// 아닌 이유는 사람이 화면 중간보다 조금 위를 읽기 때문이고, 선에 걸친 줄이 하나도 없으면
// — 목록 전체가 선 아래나 위에 있을 때 — 가장 가까운 줄이 맡는다. 항상 한 줄은 선다.
//
// 없어도 되는 기능이다: 스크립트가 안 도는 날에는 html.js-pillars 가 안 붙고, 그러면 CSS 가
// 모든 줄을 검게 세우고 액자에는 첫 장을 걸어 둔다. 읽는 데에 빠지는 것이 없다.
import { scrollStage } from "./frame.mjs?v=e97b3c06bfff";

// 화면 어느 높이를 읽는 것으로 본다는 뜻.
const FOCUS = 0.42;

export function initPillars() {
  const boxes = [...document.querySelectorAll("[data-pillars]")];
  if (!boxes.length) return;

  document.documentElement.classList.add("js-pillars");

  const state = new Map();
  for (const box of boxes) {
    state.set(box, {
      rows: [...box.querySelectorAll(".cpil")],
      shots: [...box.querySelectorAll("[data-pillar-art]")],
      at: -1,
    });
  }

  /** n 번째 줄을 활성으로 세운다. 같은 줄이면 DOM 을 건드리지 않는다. */
  function light(box, n) {
    const s = state.get(box);
    if (!s || s.at === n) return;
    s.at = n;
    s.rows.forEach((row, i) => row.classList.toggle("is-on", i === n));
    // 액자는 줄 순번으로 찾는다 — 표지 없는 줄이 있으면 둘의 개수가 어긍난다.
    for (const shot of s.shots)
      shot.classList.toggle("is-on", Number(shot.dataset.pillarArt) === n);
  }

  const paint = (box) => {
    const s = state.get(box);
    if (!s || !s.rows.length) return;
    const line = innerHeight * FOCUS;
    let best = 0;
    let gap = Infinity;
    s.rows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      if (r.height <= 0) return;
      // 선이 줄 안에 들어 있으면 그 줄이다. 아니면 선까지의 거리를 재 둔다.
      const d = line < r.top ? r.top - line : line > r.bottom ? line - r.bottom : 0;
      if (d < gap) {
        gap = d;
        best = i;
      }
    });
    light(box, best);
  };

  // 손이 있는 화면에서는 가리키는 줄이 이긴다 — 목록을 훑는 중에는 손이 뜻이고,
  // 손을 떼면 다음 스크롤에서 다시 읽는 자리로 돌아온다.
  if (matchMedia("(hover: hover)").matches) {
    for (const box of boxes) {
      const s = state.get(box);
      s.rows.forEach((row, i) => {
        row.addEventListener("pointerenter", () => light(box, i));
      });
    }
  }

  scrollStage(boxes, paint, { rootMargin: "20% 0px" });
}
