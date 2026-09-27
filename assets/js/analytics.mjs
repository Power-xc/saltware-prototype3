// dataLayer 이벤트 — data-ga-event 속성 하나로 배선한다.
// 이벤트명은 명세 v0.2 taxonomy 를 그대로 쓴다. 이름을 바꾸면 GTM 태그가 조용히 깨진다.

export function initAnalytics() {
  window.dataLayer = window.dataLayer || [];
  document.addEventListener("click", (e) => {
    const el = e.target.closest?.("[data-ga-event]");
    if (!el) return;
    // 이름만 올리면 같은 이벤트를 쏘는 것들을 GA4 에서 가를 수 없다(실측 2026-09-15:
    // industry_click 8 · solve_intent_click 7 · home_stack_click 6 · home_press_click 4 ·
    // home_event_click 4). 개편 가설 1 의 검증 항목이 "핵심 사업 도달률 · 사업 상세
    // 진입률"인데, 어느 카드가 그 도달을 만들었는지 지금 배선으로는 못 뽑는다.
    //
    // 이름은 그대로 두고 파라미터만 얹는다 — 기존 GTM 태그는 event 로만 걸려 있어
    // 더해지는 키에 영향받지 않는다. 키는 GA4 가 outbound 클릭에 쓰는 이름을 따른다.
    const href = el.getAttribute("href");
    // 라벨은 카드 제목이 있으면 그것, 없으면 글 전체다. 카드는 설명·화살표까지 품고 있어
    // 그대로 올리면 한 값이 문단이 된다 — 제목을 먼저 찾고, 길이도 잘라 둔다.
    const labelEl =
      el.querySelector?.("h1, h2, h3, [class$='__title'], [class$='__name']") ??
      el;
    const text = (labelEl.textContent ?? "").replace(/\s+/g, " ").trim();
    window.dataLayer.push({
      event: el.dataset.gaEvent,
      ...(href ? { link_url: href } : {}),
      ...(text ? { link_text: text.slice(0, 80) } : {}),
    });
  });
}

export function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
