// 커서 조명 — 어두운 카드([data-spot]) 위에서 손이 있는 자리가 은은히 밝아진다.
// 값은 --mx · --my(카드 안 px)로만 넘기고 빛의 크기·세기는 CSS 가 정한다(components.css
// "인터랙션" 구획) — parallax·stage 와 같은 약속이다. 손이 없는 화면과 모션 최소화에서는
// 아무것도 하지 않고, 스크립트가 없으면 조명 없이 카드만 선다.
export function initSpot() {
  if (!matchMedia("(hover: hover)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const el of document.querySelectorAll("[data-spot]")) {
    let tick = 0;
    el.addEventListener("pointermove", (e) => {
      if (tick) return;
      tick = requestAnimationFrame(() => {
        tick = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${Math.round(e.clientX - r.left)}px`);
        el.style.setProperty("--my", `${Math.round(e.clientY - r.top)}px`);
      });
    });
  }
}
