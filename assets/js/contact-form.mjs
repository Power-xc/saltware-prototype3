// 문의 폼 — 필수값 검증과 제출.
//
// data-endpoint 가 비어 있으면 dry-run 이다. 운영 이식 시점에 값을 넣고
// 그때 레이트리밋·캡차를 함께 건다 (docs/site-separation/03 §2-5 L-4).
// 엔드포인트를 빌드에 박지 않는다 — 배포 대상마다 달라진다.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 받침이 있으면 "을", 없으면 "를". 한글 음절은 0xAC00 부터 28자씩 한 묶음이고
// 그 안의 마지막 자리가 종성이다.
const objectParticle = (word) => {
  const last = word.trim().slice(-1).charCodeAt(0);
  if (last < 0xac00 || last > 0xd7a3) return "을";
  return (last - 0xac00) % 28 === 0 ? "를" : "을";
};

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const track = (name, params = {}) => {
  if (Array.isArray(window.dataLayer))
    window.dataLayer.push({ event: name, ...params });
};

function fieldError(input, message) {
  const wrap = input.closest(".field");
  if (!wrap) return;
  wrap.querySelector(".field__error")?.remove();
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (!message) return;
  const p = document.createElement("p");
  p.className = "field__error";
  p.textContent = message;
  wrap.appendChild(p);
}

function validate(form) {
  const bad = [];
  for (const input of form.querySelectorAll(".field input, .field textarea")) {
    const label =
      input
        .closest(".field")
        ?.querySelector("label")
        ?.textContent.replace(" *", "")
        .trim() ?? "";
    const value = input.value.trim();
    let message = "";
    if (input.required && !value)
      message = `${label}${objectParticle(label)} 입력해 주세요.`;
    else if (input.name === "email" && value && !EMAIL.test(value))
      message = "이메일 형식을 확인해 주세요.";
    fieldError(input, message);
    if (message) bad.push(input);
  }
  return bad;
}

function setupForm(form) {
  form.setAttribute("novalidate", "");
  const params = new URLSearchParams(location.search);
  const buSelect = form.querySelector('[name="business_unit"]');
  const wanted = params.get("business");
  if (
    buSelect &&
    wanted &&
    [...buSelect.options].some((o) => o.value === wanted)
  ) {
    buSelect.value = wanted;
  }
  const srcPage = form.querySelector('[name="source_page"]');
  if (srcPage) srcPage.value = params.get("from") ?? "";
  const ctaPos = form.querySelector('[name="cta_position"]');
  if (ctaPos) ctaPos.value = params.get("source") ?? "";

  form.querySelector('[name="phone"]')?.addEventListener("input", (e) => {
    e.target.value = formatPhone(e.target.value);
  });
}

function setupTopics(form) {
  const chips = [...form.querySelectorAll("[data-topic]")];
  const press = (chip) => {
    for (const c of chips) c.setAttribute("aria-pressed", "false");
    chip.setAttribute("aria-pressed", "true");
  };
  for (const chip of chips) {
    chip.addEventListener("click", () => press(chip));
  }
  // 사업 지면의 CTA 가 ?topic= 으로 무엇을 요청했는지 알려 준다(attribution.mjs).
  // 모르는 값이면 손대지 않는다 — 첫 칩이 눌린 채로 열린다.
  const wanted = new URLSearchParams(location.search).get("topic");
  const target = wanted && chips.find((c) => c.dataset.topic === wanted);
  if (target) press(target);
  return () =>
    form.querySelector('[data-topic][aria-pressed="true"]')?.dataset.topic ??
    "";
}

function setupSubmission(form, endpoint, topic, buSelect, submit, state) {
  let busy = false;
  const business = () => buSelect?.value ?? "";
  const say = (text, kind = "") => {
    if (!state) return;
    state.textContent = text;
    state.className = `state${kind ? ` state--${kind}` : ""}`;
    state.hidden = !text;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    const bad = validate(form);
    if (bad.length) {
      const missing = bad.some((i) => !i.value.trim());
      say(missing ? "입력하지 않은 항목이 있습니다." : "입력 내용을 확인해 주세요.", "error");
      track("contact_validation_error");
      bad[0].focus();
      return;
    }
    if (!form.querySelector('[name="consent"]')?.checked) {
      say("개인정보 수집·이용 동의가 필요합니다.", "error");
      return;
    }

    busy = true;
    submit?.setAttribute("aria-disabled", "true");
    say("보내는 중…");

    if (!endpoint) {
      track("generate_lead", {
        lead_category: topic(),
        lead_business: business(),
        transport: "dry-run",
      });
      say(
        "확인했습니다. 지금은 접수 경로가 연결되지 않아 실제로 전송되지 않았습니다.",
        "ok",
      );
      busy = false;
      submit?.removeAttribute("aria-disabled");
      return;
    }

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, topic: topic() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("generate_lead", {
        lead_category: topic(),
        lead_business: business(),
      });
      say("문의가 접수되었습니다. 영업일 기준 1일 내 회신드립니다.", "ok");
      form.reset();
    } catch {
      say("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      busy = false;
      submit?.removeAttribute("aria-disabled");
    }
  });
}

export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  setupForm(form);
  const topic = setupTopics(form);
  const submit = form.querySelector("[data-submit]");
  const state = form.querySelector("[data-form-state]");
  const buSelect = form.querySelector('[name="business_unit"]');
  const endpoint = form.dataset.endpoint || "";

  setupSubmission(form, endpoint, topic, buSelect, submit, state);
}
