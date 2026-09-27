/* 배경으로 도는 영상([data-ambient])을 다룬다. 지금 쓰는 곳은 회사 소개 머리 표지
   하나뿐이지만(/company/about), 자리마다 스크립트를 하나씩 두지 않으려고 선택자로 잡는다.
 *
 * 하는 일이 둘이다.
 *   1) prefers-reduced-motion: reduce 면 아예 재생하지 않는다. 이 저장소의 스크립트
 *      일곱이 모두 그렇게 한다(counter · droplets · parallax · reveal · stage …).
 *      autoplay 속성은 CSS 로 못 끄므로 여기서 pause 하고 속성을 떼야 한다.
 *   2) 화면 밖으로 나가면 멈춘다. 머리 표지는 스크롤하면 곧 사라지는데, 그 뒤로도
 *      계속 도는 것은 배터리와 CPU 를 그냥 쓰는 것이다(홈 히어로가 같은 일을 한다 —
 *      hero-object.mjs 의 visible 플래그).
 *
 * 스크립트가 죽어도 지면은 멀쩡하다. autoplay 가 마크업에 있으므로 영상은 그냥 돈다 —
 * 없어도 되는 기능이다. 반대로 poster 가 있어 영상이 안 뜨는 환경에서도 빈 면이 되지 않는다. */
export function initAmbientVideo() {
  const list = [...document.querySelectorAll("video[data-ambient]")];
  if (!list.length) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const v of list) {
      v.removeAttribute("autoplay");
      v.pause();
      // 첫 프레임에 세워 둔다 — 멈춘 영상이 아니라 사진 한 장으로 보이게.
      try {
        v.currentTime = 0;
      } catch {
        /* 아직 메타데이터가 없으면 그냥 둔다 */
      }
    }
    return;
  }

  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      }
    },
    { rootMargin: "100px" },
  );
  for (const v of list) io.observe(v);
}
