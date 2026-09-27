// 문의 attribution — /contact 로 가는 모든 링크에 business·source·from 을 붙인다.
//
// 36곳의 CTA 데이터에 파라미터를 일일이 박는 대신, 클릭 순간에 한 번 붙인다.
// 사업 페이지는 body class(bu bu--{slug})가 사업을 말해 주고, 버튼 위치는
// data-ga-event 가, 출발 페이지는 location.pathname 이 말해 준다.
// JS 가 죽으면 파라미터 없이 /contact 로만 간다 — 폼 자체는 그대로 동작한다.

export function initAttribution() {
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const raw = a.getAttribute("href") ?? "";
      if (!/\/contact\/?(?:[?#]|$)/.test(raw)) return;

      const url = new URL(a.href, location.origin);
      const bu = document.body.className.match(/\bbu--([a-z0-9-]+)/)?.[1];
      if (bu && !url.searchParams.has("business")) {
        url.searchParams.set("business", bu);
      }
      const event = a.dataset.gaEvent;
      if (event && !url.searchParams.has("source")) {
        url.searchParams.set("source", event);
      }
      // 버튼이 약속한 것(진단·자료·상담)을 폼에 그대로 넘긴다. 없으면 안 붙인다 —
      // 폼은 첫 칩(도입 문의)으로 열린다.
      const topic = a.dataset.topic;
      if (topic && !url.searchParams.has("topic")) {
        url.searchParams.set("topic", topic);
      }
      if (!url.searchParams.has("from")) {
        url.searchParams.set("from", location.pathname);
      }
      a.setAttribute("href", url.pathname + url.search + url.hash);
    },
    // capture — 분석 스크립트보다 먼저, 그리고 내비게이션 전에 href 를 바꾼다.
    true,
  );
}
