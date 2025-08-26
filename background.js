const OFFICIAL_DOMAIN = "podopicker.store";
const BRAND = "podopicker";

// 공식 도메인 판별
function isOfficialDomain(hostname) {
    const h = hostname.toLowerCase();
    return h === OFFICIAL_DOMAIN || h.endsWith("." + OFFICIAL_DOMAIN);
}

// 브랜드 이름 포함 but 공식 X
function looksLikeBrandButNotOfficial(hostname) {
    const h = hostname.toLowerCase();
    if (isOfficialDomain(h)) return false;
    return h.includes(BRAND);
}

// 호스트에서 SLD 뽑기 (예: a.b.c → b)
function getSLD(hostname) {
    const parts = hostname.toLowerCase().split(".").filter(Boolean);
    if (parts.length < 2) return hostname.toLowerCase();
    return parts[parts.length - 2];
}

// 시각 혼동 문자 치환 규칙
function normalizeLabel(s) {
    return s
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/rn/g, "m")
        .replace(/@/g, "a")
        .replace(/\$/g, "s")
        .replace(/9/g, "g");
}

// 1글자 오타 탐지
function isOneOffTypo(s, t) {
    if (!s || !t) return false;
    if (s.length !== t.length) return false;
    let diff = 0;
    for (let i = 0; i < s.length; i++) if (s[i] !== t[i]) diff++;
    return diff === 1;
}

// 차단 페이지 URL
function blockPageURL(target, reason) {
    const u = new URL(chrome.runtime.getURL("block.html"));
    if (target) u.searchParams.set("target", target);
    if (reason) u.searchParams.set("reason", reason);
    return u.toString();
}

// 네비게이션 가로채기
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    try {
        if (details.frameId !== 0) return;
        const url = new URL(details.url);
        const host = url.hostname;

        // 공식은 통과
        if (isOfficialDomain(host)) return;

        // 브랜드 문자열 포함 → 차단
        if (looksLikeBrandButNotOfficial(host)) {
            chrome.tabs.update(details.tabId, {
                url: blockPageURL(details.url, "brand_misuse")
            });
            return;
        }

        // 오타/시각 혼동 → 차단
        const sld = getSLD(host);
        const norm = normalizeLabel(sld);
        const brandNorm = normalizeLabel(BRAND);

        if (norm === brandNorm || isOneOffTypo(norm, brandNorm)) {
            chrome.tabs.update(details.tabId, {
                url: blockPageURL(details.url, "visual_confusion")
            });
            return;
        }

        // 일반 사이트는 통과
    } catch (e) {
        console.error(e);
    }
}, { url: [{ urlMatches: ".*" }] });
