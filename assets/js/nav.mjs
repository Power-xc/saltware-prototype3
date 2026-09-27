// 헤더 — 메가메뉴 · 모바일 서랍.
// 헤더 마크업은 이미 HTML 안에 있다. 이 스크립트는 열고 닫기만 한다.

function initMegamenu(header) {
  const triggers = [...header.querySelectorAll("[data-mega]")];
  const panels = new Map(
    [...header.querySelectorAll("[data-mega-panel]")].map((p) => [
      p.dataset.megaPanel,
      p,
    ]),
  );
  let openedBy = null;
  let closeTimer = 0;
  // Escape 뒤에 초점을 돌려줄 때 focus 핸들러가 메뉴를 도로 여는 것을 막는다(실측 2026-09-14).
  let returning = false;

  const cancelClose = () => clearTimeout(closeTimer);
  const close = () => {
    cancelClose();
    triggers.forEach((t) => t.setAttribute("aria-expanded", "false"));
    panels.forEach((p) => (p.hidden = true));
    openedBy = null;
  };
  const open = (key, how) => {
    close();
    const t = triggers.find((x) => x.dataset.mega === key);
    const p = panels.get(key);
    if (!t || !p) return;
    t.setAttribute("aria-expanded", "true");
    p.hidden = false;
    openedBy = how;
  };

  triggers.forEach((t) => {
    t.addEventListener("mouseenter", () => open(t.dataset.mega, "hover"));
    t.addEventListener("focus", () => {
      if (!returning) open(t.dataset.mega, "focus");
    });
    t.addEventListener("click", () =>
      t.getAttribute("aria-expanded") === "true"
        ? close()
        : open(t.dataset.mega, "hover"),
    );
  });
  header.addEventListener("mouseenter", cancelClose);
  header.addEventListener("mouseleave", () => {
    if (openedBy !== "hover") return;
    cancelClose();
    closeTimer = setTimeout(close, 160);
  });
  header.addEventListener("focusout", (e) => {
    if (openedBy === "focus" && !header.contains(e.relatedTarget)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = triggers.find(
      (t) => t.getAttribute("aria-expanded") === "true",
    );
    close();
    returning = true;
    open?.focus();
    returning = false;
  });
}

function initDrawer() {
  const drawer = document.getElementById("drawer");
  const openBtn = document.querySelector("[data-drawer-open]");
  const closeBtn = document.querySelector("[data-drawer-close]");
  if (!drawer || !openBtn) return;

  const FOCUSABLE =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = () =>
    [...drawer.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );

  const setDrawer = (on) => {
    drawer.hidden = !on;
    openBtn.setAttribute("aria-expanded", String(on));
    document.documentElement.style.overflow = on ? "hidden" : "";
    if (on) focusables()[0]?.focus();
    else openBtn.focus();
  };

  openBtn.addEventListener("click", () => setDrawer(true));
  closeBtn?.addEventListener("click", () => setDrawer(false));
  drawer.addEventListener(
    "click",
    (e) => e.target.closest("a") && setDrawer(false),
  );

  drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.hidden) setDrawer(false);
  });

  drawer.querySelectorAll(".drawer__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!on));
      btn.nextElementSibling.hidden = on;
    });
  });
}

// 스크롤 상태 — 첫 화면을 벗어나면 html.is-scrolled(헤더 그늘 · 맨 위로 단추가 뜬다).
// 좁은 화면에서는 아래로 내리면 헤더를 접고(is-hidden) 올리면 다시 편다 — 폰에서 64px 띠가
// 늘 화면을 먹고 있을 이유가 없다. 값은 클래스로만 넘기고 움직임은 CSS 가 정한다.
// 스크립트가 없으면 헤더는 늘 서 있고 맨 위로 단추만 안 뜬다 — 그 단추는 JS 가 없으면
// 어차피 아무것도 안 한다.
const SCROLLED_AT = 8;
const HIDE_AFTER = 120;

function initHeaderScroll(header) {
  const root = document.documentElement;
  const bp = getComputedStyle(root).getPropertyValue("--bp-md").trim();
  const narrow = matchMedia(`(max-width: ${bp})`);
  let last = scrollY;
  let ticking = false;
  const paint = () => {
    ticking = false;
    const y = scrollY;
    root.classList.toggle("is-scrolled", y > SCROLLED_AT);
    const down = y > last && y > HIDE_AFTER;
    const open = header.querySelector('[aria-expanded="true"]');
    header.classList.toggle("is-hidden", narrow.matches && down && !open);
    last = y;
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  };
  addEventListener("scroll", schedule, { passive: true });
  narrow.addEventListener("change", paint);
  // 키보드로 헤더에 들어오면 접힌 헤더를 편다 — 초점이 화면 밖에 있으면 안 된다.
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  paint();
}

export function initNav() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  initMegamenu(header);
  initDrawer();
  initHeaderScroll(header);

  document.querySelector("[data-to-top]")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
