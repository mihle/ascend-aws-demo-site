const token = document.querySelector('meta[name="customer-company-name"]')?.content ?? "";
const companyName = token === "__COMPANY_NAME__" ? "Aster & Co." : token;
const companyInitial = companyName.trim().charAt(0).toUpperCase() || "A";

document.querySelectorAll("[data-company-name]").forEach((element) => {
  element.textContent = companyName;
});
document.querySelectorAll("[data-company-initial]").forEach((element) => {
  element.textContent = companyInitial;
});

document.title = `${companyName} · Ideas with momentum`;
