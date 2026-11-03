/* Sprint 18 — testa a nova interface sem importar os cursos antigos. */
import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.locator("#entryGate").waitFor({ state: "visible" });
  await page.locator("#gateDemoButton").click();
  await page.locator(".course-card").first().waitFor({ timeout: 30000 });
  assert.equal(await page.locator(".course-card").count(), 3, "Três cursos ilustrativos na home");
  assert.match(await page.locator("#main h1").innerText(), /Estudo e formação/);
  console.log("OK — Home, identidade e três cursos ilustrativos.");

  const lessons = ["escuta", "pergunta-freud", "conflito-exemplo"];
  for (const id of lessons) {
    await page.goto(base + "/#/aula/" + id);
    await page.locator(".quiz-option").first().waitFor();
    assert.equal(await page.locator(".quiz-option").count(), 3);
    await page.locator(".quiz-option").first().click();
    await page.locator(".quiz-feedback").waitFor();
    assert.ok((await page.locator(".quiz-feedback").innerText()).length > 15);
  }
  console.log("OK — Três aulas fictícias e quizzes.");

  await page.goto(base + "/#/aula/pergunta-freud");
  await page.locator("#lessonNote").fill("Anotação de teste do Sprint 18");
  await page.waitForTimeout(650);
  await page.locator("[data-complete]").click();
  await page.goto(base + "/#/progresso");
  assert.match(await page.locator(".progress-head").innerText(), /1 de 3/);
  await page.goto(base + "/#/caderno");
  assert.match(await page.locator("#main").innerText(), /Anotação de teste do Sprint 18/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#main").getByText("Anotação de teste do Sprint 18").waitFor();
  console.log("OK — Progresso, caderno e persistência local.");

  await page.goto(base + "/#/estudio/pergunta-freud");
  await page.locator("#editTitle").fill("Título ilustrativo editado");
  await page.locator("#editorForm button[type=submit]").click();
  assert.match(await page.locator("#editorStatus").innerText(), /Rascunho salvo/);
  await page.goto(base + "/#/aula/pergunta-freud");
  assert.match(await page.locator("#main h1").innerText(), /Título ilustrativo editado/);
  console.log("OK — Estúdio demonstrativo local.");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(base + "/", { waitUntil: "domcontentloaded" });
  await mobile.locator("#entryGate").waitFor({ state: "visible" });
  await mobile.locator("#gateDemoButton").click();
  await mobile.locator(".course-card").first().waitFor();
  assert.equal(await mobile.locator(".course-card").count(), 3);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true, "Sem rolagem horizontal");
  await mobile.locator("#menuToggle").click();
  assert.match(await mobile.locator("#sidebar").getAttribute("class"), /is-open/);
  await mobile.locator('#sidebar a[href="#/caderno"]').click();
  await mobile.locator("#main h1").getByText("Meu caderno").waitFor();
  console.log("OK — Navegação mobile em 390 px.");
} finally {
  await browser.close();
}
