/* Sprint 19 — testa isolamento entre contas e fila de sincronização, sem Firebase real. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.abort());
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.locator('#entryGate').waitFor({ state: 'visible' });
  await page.locator('#gateDemoButton').click();
  await page.locator('.course-card').first().waitFor();

  // Anonymous data remain separate and must not leak to a logged-in account.
  await page.goto('http://127.0.0.1:4173/#/aula/escuta');
  await page.locator('#lessonNote').fill('Anotação anônima');
  assert.match(await page.locator('#lessonNote').inputValue(), /anônima/);
  await page.evaluate(() => {
    window.__cloudWrites = [];
    window.__failWrites = false;
    window.AtelieCloud = {
      user: { uid: 'account-a' }, ready: true,
      save: async data => {
        if (window.__failWrites) throw new Error('sem conexão de teste');
        window.__cloudWrites.push(JSON.parse(JSON.stringify(data)));
        return true;
      }
    };
    dispatchEvent(new CustomEvent('atelie-cloud-auth', { detail: { uid: 'account-a' } }));
    dispatchEvent(new CustomEvent('atelie-cloud-loaded', { detail: { uid: 'account-a', exists: false, state: null } }));
    dispatchEvent(new CustomEvent('atelie-cloud-ready', { detail: { uid: 'account-a' } }));
  });
  assert.equal(await page.locator('#lessonNote').inputValue(), '', 'Conta não recebe rascunho anônimo');
  await page.locator('#lessonNote').fill('Nota privada da conta A');
  await page.waitForFunction(() => window.__cloudWrites.length > 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('ateliepsi-beta-state-v1:pending:account-a')), null);

  await page.evaluate(() => {
    window.AtelieCloud.user = { uid: 'account-b' };
    dispatchEvent(new CustomEvent('atelie-cloud-auth', { detail: { uid: 'account-b' } }));
  });
  assert.equal(await page.locator('#lessonNote').inputValue(), '', 'Conta B não vê anotações da A');
  await page.evaluate(() => {
    window.AtelieCloud.user = { uid: 'account-a' };
    dispatchEvent(new CustomEvent('atelie-cloud-auth', { detail: { uid: 'account-a' } }));
  });
  assert.equal(await page.locator('#lessonNote').inputValue(), 'Nota privada da conta A');

  await page.evaluate(() => { window.__failWrites = true; });
  await page.locator('#lessonNote').fill('Alteração offline da conta A');
  await page.waitForTimeout(1000);
  assert.ok(await page.evaluate(() => localStorage.getItem('ateliepsi-beta-state-v1:pending:account-a')), 'Fila pendente permanece após erro');
  await page.evaluate(() => {
    window.__failWrites = false;
    dispatchEvent(new CustomEvent('atelie-cloud-ready', { detail: { uid: 'account-a' } }));
  });
  await page.waitForFunction(() => localStorage.getItem('ateliepsi-beta-state-v1:pending:account-a') === null);
  assert.equal(await page.locator('#lessonNote').inputValue(), 'Alteração offline da conta A');

  // If another device holds a newer version, do not overwrite it automatically.
  await page.evaluate(() => { window.__failWrites = true; });
  await page.locator('#lessonNote').fill('Cópia deste dispositivo');
  await page.evaluate(() => {
    const remote = { saved: [], completed: [], notes: { escuta: 'Cópia mais recente da nuvem' }, answers: {}, updatedAt: Date.now() + 60000 };
    dispatchEvent(new CustomEvent('atelie-cloud-loaded', { detail: { uid: 'account-a', exists: true, state: remote } }));
  });
  await page.locator('#syncConflict').waitFor({ state: 'visible' });
  await page.locator('[data-conflict="cloud"]').click();
  assert.equal(await page.locator('#lessonNote').inputValue(), 'Cópia mais recente da nuvem');
  assert.equal(await page.evaluate(() => localStorage.getItem('ateliepsi-beta-state-v1:pending:account-a')), null);
  console.log('OK — isolamento de contas, fila de sincronização e escolha de conflito.');
} finally {
  await browser.close();
}
