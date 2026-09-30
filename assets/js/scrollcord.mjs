// 스크롤 진행률로 **몇 번째인지**를 고르는 판. 붙박인 판 하나 안에서 칸이 차례로
// 온다(인재채용의 사내복지 서랍과 지원 절차 카드 줄, careers.css).
// 결은 toss.im/business/pg 다(실측 2026-09-28 — 판이 화면 위 160px 에 붙박인 채
// 칸당 약 450px 을 지나며 하나씩 온다).
//
// 여기서 하는 일은 **번호 하나를 고르는 것**뿐이다. 칸이 어떻게 생겼는지, 붙박이는
// 높이, 스크롤 예산은 전부 CSS 가 정한다 — pillars.mjs 와 같은 약속이다.
// 칸에 붙는 표시는 둘이다:
//   is-on    지금 칸 하나
//   is-past  이미 지나온 칸들
// 사내복지 서랍은 is-on 만 본다(한 번에 하나만 열린다). 지원 절차는 둘을 합쳐
// 본다(온 것은 그대로 남고 다음이 더해진다). 같은 수 하나로 두 결을 낸다.
//
// 없어도 되는 기능이다:
//  - 스크립트가 안 돌면 html.js-scrollcord 가 안 붙는다. 접는 규칙이 전부 그 클래스
//    안에 있으므로 세 묶음이 다 펼쳐진 채 세로로 늘어선다 — 읽는 데에 빠지는 것이 없다.
//  - prefers-reduced-motion 이면 아무것도 하지 않는다(클래스도 붙이지 않는다).
//  - 좁은 폭에서는 CSS 가 붙박이를 켜지 않는다. 이 스크립트는 그래도 돌지만, 판이
//    흘러가는 동안 읽는 줄을 고르는 것뿐이라 해가 없다.
import { scrollStage } from "./frame.mjs?v=526637b4ceb5";

export function initScrollcord() {
  const stages = [...document.querySelectorAll("[data-scrollcord]")];
  if (!stages.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 첫 칠 전에 붙여야 세 묶음이 다 펼쳐졌다가 접히는 것이 보이지 않는다.
  document.documentElement.classList.add("js-scrollcord");

  const state = new Map();
  for (const stage of stages) {
    // 칸은 클래스가 아니라 표시로 찾는다 — 서랍(.crsup__row)과 절차 카드
    // (.crstep__item)가 같은 배선을 쓴다. 클래스로 찾으면 한 벌을 더 복사해야 하고,
    // 두 벌이 갈리는 순간 한쪽만 고쳐진다(disclosure.mjs 가 같은 이유로 aria 를 본다).
    const rows = [...stage.querySelectorAll("[data-scrollcord-item]")];
    // 스크롤 예산은 칸 수에 비례한다(careers.css 의 판 높이). 그 수를 조판이 style
    // 로 적을 수 없어(빌드가 인라인 style 을 막는다) 여기서 센다.
    stage.style.setProperty("--rows", String(rows.length));
    state.set(stage, { rows, at: -1 });
  }

  function open(stage, n) {
    const s = state.get(stage);
    if (!s || s.at === n) return;
    s.at = n;
    s.rows.forEach((row, i) => {
      row.classList.toggle("is-on", i === n);
      row.classList.toggle("is-past", i < n);
    });
  }

  const paint = (stage) => {
    const s = state.get(stage);
    if (!s || !s.rows.length) return;
    const r = stage.getBoundingClientRect();
    if (r.height <= 0) return;
    // 진행률: 판의 머리가 화면 꼭대기를 지난 거리를, **판이 지나갈 수 있는 거리**로
    // 나눈다. 판 높이에서 화면 한 판을 빼는 것이 그 거리다 — 판의 꼬리가 화면
    // 바닥에 닿는 순간이 끝이다. 붙박인 줄 뭉치의 실제 높이로 재지 않는다:
    // 그 높이는 줄이 열리고 접히며 바뀌므로, 진행률이 제가 만든 변화를 다시 읽는
    // 되먹임이 된다(줄 경계에서 두 줄이 번갈아 깜빡인다).
    const travel = r.height - innerHeight;
    if (travel <= 0) return;
    const p = Math.max(0, Math.min(0.9999, -r.top / travel));
    // 번호 말고 **진행률 그대로**도 내준다(2026-09-28). 인재상 네 칸은 레일이라
    // 칸 경계에서 툭 끊기면 안 되고 0→1 사이를 이어서 써야 한다 — 미는 거리는
    // 여기서 재지 않는다. 얼마나 미는지는 CSS 가 정한다(careers.css 의 --crv-travel).
    // 앞서 있던 소비자 둘(사내복지 서랍 · 지원 절차)은 이 값을 보지 않는다.
    stage.style.setProperty("--p", p.toFixed(4));
    open(stage, Math.floor(p * s.rows.length));
  };

  scrollStage(stages, paint, { rootMargin: "25% 0px" });
}
