const params = new URLSearchParams(location.search);
const target = params.get("target") || "-";
document.getElementById("target").textContent = "요청한 주소: " + target;
