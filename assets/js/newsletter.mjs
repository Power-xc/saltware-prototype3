// 뉴스레터 구독 폼 — 문의 폼과 같은 dry-run 계약.
//
// data-endpoint 가 비어 있으면 아무 데도 보내지 않고 흐름만 확인한다.
// 운영 이식 시점에 값을 넣고, 그때 레이트리밋·캡차를 문의 폼과 함께 건다.

import { track } from "./analytics.mjs?v=f9ee8d41d42e";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initNewsletter() {
  const form = document.querySelector("[data-newsletter-form]");
  if (!form) return;

  // 브라우저 기본 말풍선 대신 한국어 인라인 상태를 쓴다. JS 가 죽으면
  // novalidate 가 걸리지 않아 required 속성이 그대로 남는다.
  form.setAttribute("novalidate", "");

  const endpoint = form.dataset.endpoint || "";
  const input = form.querySelector('[name="email"]');
  const consent = form.querySelector('[name="consent"]');
  const submit = form.querySelector("[data-submit]");
  const state = form.querySelector("[data-form-state]");
  let busy = false;

  const say = (text, kind = "") => {
    if (!state) return;
    state.textContent = text;
    state.className = `state${kind ? ` state--${kind}` : ""}`;
    state.hidden = !text;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    const value = input?.value.trim() ?? "";
    if (!EMAIL.test(value)) {
      input?.setAttribute("aria-invalid", "true");
      say("이메일 형식을 확인해 주세요.", "error");
      input?.focus();
      return;
    }
    input?.setAttribute("aria-invalid", "false");
    if (consent && !consent.checked) {
      say("뉴스레터 수신 동의가 필요합니다.", "error");
      return;
    }

    busy = true;
    submit?.setAttribute("aria-disabled", "true");
    say("보내는 중…");

    if (!endpoint) {
      // 엔드포인트 배선 전에는 흐름만 확인한다. 아무 데도 보내지 않는다.
      track("newsletter_signup", { transport: "dry-run" });
      say(
        "확인했습니다. 지금은 구독 경로가 연결되지 않아 실제로 접수되지 않았습니다.",
        "ok",
      );
      busy = false;
      submit?.removeAttribute("aria-disabled");
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("newsletter_signup");
      say("구독 신청이 접수되었습니다.", "ok");
      form.reset();
    } catch {
      say("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      busy = false;
      submit?.removeAttribute("aria-disabled");
    }
  });
}
