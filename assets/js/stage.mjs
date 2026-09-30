// 스크롤 무대 — 긴 판 하나가 화면을 지나가는 동안의 진행률(0 → 1)을 --p 로 넘긴다
// (사령관 2026-09-11, saltlux 회사개요의 레이아웃 둘). 붙박이(sticky)로 고정된 판 안에서
// 무엇이 어떻게 움직일지는 전부 CSS 가 정하고, 여기서는 수 하나만 준다 — parallax.mjs 와
// 같은 약속이다.
//
// 진행률의 뜻: **이 판의 위쪽이 화면 위로 얼마나 지나갔나**를 판 높이로 나눈 값이다.
//   p = 0   판의 머리가 아직 화면 꼭대기에 닿지 않았다
//   p = 1   판을 제 높이만큼 다 지났다
// 화면 높이로 나누지 않는다 — 그러면 판 높이를 바꿀 때마다 CSS 쪽 구간을 다시 재야 한다.
// 판 높이(vh 로 적는다)가 기준이라 구간(0.3, 0.63 …)이 화면 크기와 무관하게 그대로 간다.
//
// 없어도 되는 기능이다:
//  - 스크립트가 안 돌면 html.js-stage 가 붙지 않는다. CSS 의 겹치기·축소 규칙은 전부
//    그 클래스 안에 있으므로 카드는 그냥 세로로 늘어서고 글은 제자리에 선다.
//  - prefers-reduced-motion 이면 아무것도 하지 않는다(클래스도 붙이지 않는다).
import { scrollStage } from "./frame.mjs?v=10ba0c3717a7";

export function initStage() {
  const stages = [...document.querySelectorAll("[data-stage]")];
  if (!stages.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 붙는 순간부터 CSS 가 겹치기를 맡는다. 첫 칠(paint) 전에 붙여야 카드가 제자리에
  // 섰다가 겹치는 것이 보이지 않는다 — main.mjs 가 module 로 실려 DOM 직후에 돈다.
  document.documentElement.classList.add("js-stage");

  // 판이 화면에 닿기 전에 미리 한 번 재 둔다 — 위에서 아래로 튕겨 들어올 때
  // 첫 프레임이 0 인 채로 그려지면 카드가 한 번 깜빡인다.
  scrollStage(
    stages,
    (stage) => {
      const r = stage.getBoundingClientRect();
      if (r.height <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / r.height));
      stage.style.setProperty("--p", p.toFixed(4));
    },
    { rootMargin: "25% 0px" },
  );
}
