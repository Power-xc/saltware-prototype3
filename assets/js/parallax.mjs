// 패럴랙스 — 전면 사진이 지면보다 느리게 흐른다(사령관 2026-09-11 "움직이는 게 부족하다").
//
// 원칙은 이 저장소의 다른 모션과 같다:
//  - 스크립트가 없으면 사진은 그냥 제자리에 선다. 숨기거나 어긋난 상태로 남지 않는다.
//  - prefers-reduced-motion 이면 아무것도 하지 않는다.
//  - 값은 CSS 변수(--py)로만 넘긴다. 움직이는 방법은 CSS 가 정한다(components 쪽 규칙).
// 화면에 들어온 판만 프레임당 한 번 재는 비계는 frame.mjs 가 맡는다.
//
// 켜는 쪽은 마크업이다: [data-parallax] 가 붙은 판만 움직인다.
import { scrollStage } from "./frame.mjs?v=3565a04c324d";

const MAX = 0.18; // 판 높이의 몇 배까지 흐르게 할지 — 넘기면 사진 위아래 끝이 드러난다

export function initParallax() {
  const boxes = [...document.querySelectorAll("[data-parallax]")];
  if (!boxes.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  scrollStage(boxes, (box) => {
    const h = innerHeight;
    const r = box.getBoundingClientRect();
    // 판 가운데가 화면 가운데에 올 때 0 이고, 위로 지나가면 -, 아래에 있으면 +.
    const mid = r.top + r.height / 2;
    const p = (mid - h / 2) / (h / 2 + r.height / 2);
    box.style.setProperty("--py", (Math.max(-1, Math.min(1, p)) * MAX).toFixed(4));
  });
}
