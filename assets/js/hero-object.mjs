// 메인 히어로 카드 — 01 · 02 는 고정, 03 ~ 06 중 하나만 가로로 펼쳐진다. 작은 카드나
// 층 띠의 탭을 누르면 그 카드가 제자리에서 펼쳐지고 있던 가로 카드가 접힌다 — 번호도
// 내용도 자리를 떠나지 않는다. 펼친 카드의 영상만 재생한다(01 · 02 는 늘).
// 커서를 따라 여섯 장의 그림이 같이 기운다 — 스틸도 멈춰 있지 않게(2026-09-10).
// 접근성·배터리 배려: reduced-motion 은 재생도 시차도 없고, 화면 밖이면 전부 멈춘다.

export function initHeroObject() {
  const track = document.querySelector("[data-hcards]");
  if (!track) return;
  const cards = [...track.querySelectorAll("[data-hcard]")];
  const flex = [...track.querySelectorAll("[data-hflex]")];
  const tabs = [...document.querySelectorAll("[data-hlayer]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let visible = true;

  const isWide = (c) => c.classList.contains("hcard--wide");
  const sync = () => {
    cards.forEach((c) => {
      const v = c.querySelector("video");
      if (!v) return;
      const plays = !reduced && visible && (!c.dataset.hflex || isWide(c));
      if (plays) v.play().catch(() => {});
      else v.pause();
    });
    tabs.forEach((t, i) => {
      const c = cards[i];
      const on = !!c && (!c.dataset.hflex || isWide(c));
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
  };
  const expand = (card) => {
    if (isWide(card)) return;
    flex.forEach((c) => {
      const on = c === card;
      c.classList.toggle("hcard--wide", on);
      c.classList.toggle("hcard--mini", !on);
      const t = c.querySelector(".hcard__text");
      if (t) {
        t.classList.remove("is-in");
        if (on) {
          void t.offsetWidth;
          t.classList.add("is-in");
        }
      }
    });
    sync();
  };

  flex.forEach((c) => {
    // 작은 카드의 첫 클릭은 펼침, 펼친 카드의 클릭은 이동.
    c.addEventListener("click", (e) => {
      if (isWide(c)) return;
      e.preventDefault();
      expand(c);
    });
  });
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      const c = cards[i];
      if (c?.dataset.hflex) expand(c);
    });
  });

  // 커서를 따라 그림만 민다 — 카드 틀은 제자리다. 여섯이 같은 값으로 움직여야 한 장면이
  // 기울어 보인다(카드마다 제 중심으로 재면 여섯이 따로 논다). 스틸이든 영상이든 같은 규칙이라
  // 04~06 이 멈춰 있지 않다. 미는 폭은 CSS 가 정한다(--px · --py 는 -1~1).
  if (!reduced && matchMedia("(hover: hover)").matches) {
    let box = null;
    let tick = 0;
    const measure = () => (box = track.getBoundingClientRect());
    const move = (e) => {
      if (!box) measure();
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      const y = ((e.clientY - box.top) / box.height) * 2 - 1;
      if (tick) return;
      tick = requestAnimationFrame(() => {
        tick = 0;
        track.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
        track.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    };
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerleave", () => {
      track.style.setProperty("--px", "0");
      track.style.setProperty("--py", "0");
    });
    addEventListener("resize", measure, { passive: true });
    addEventListener("scroll", measure, { passive: true });
  }

  if (reduced) cards.forEach((c) => c.querySelector("video")?.removeAttribute("autoplay"));
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.05 },
  );
  io.observe(track);
  sync();
}
