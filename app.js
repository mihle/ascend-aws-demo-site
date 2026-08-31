const token = document.querySelector('meta[name="ascend-site-name"]')?.content ?? "";
const siteName = token === "__SITE_NAME__" ? "Ascend AWS Demo Site" : token;

document.querySelectorAll("[data-site-name]").forEach((element) => {
  element.textContent = siteName;
});
document.title = `${siteName} · Governed by Ascend`;

const clock = document.querySelector("#clock");
const updateClock = () => {
  if (!clock) return;
  clock.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
};
updateClock();
setInterval(updateClock, 1000);
