// 스크롤 무대 하나 — 화면에 들어온 판만, 프레임에 한 번만 잰다.
//
// parallax·stage·year-stage 가 같은 비계를 각자 세우고 있었다(2026-09-13 정리):
// IntersectionObserver 로 살아 있는 판을 모으고, scroll·resize 를 requestAnimationFrame
// 하나로 묶고, 값은 CSS 변수로만 넘긴다 — 다른 건 "무엇을 재는가" 뿐이었다.
// year-stage 만 이 관문이 없어 지면 어디에 있든 매 프레임 열몇 개의 상자를 재고 있었다.
//
// paint 는 판 하나를 받아 그 판의 값만 세운다. 레이아웃을 읽기만 하고 쓰지 않는다면
// 프레임당 한 번의 강제 배치로 끝난다.
export function scrollStage(els, paint, { rootMargin = "10% 0px" } = {}) {
  const live = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) live.add(e.target);
        else live.delete(e.target);
      }
      schedule();
    },
    { rootMargin },
  );
  for (const el of els) io.observe(el);

  let ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      for (const el of live) paint(el);
    });
  }

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  schedule();
  return schedule;
}
