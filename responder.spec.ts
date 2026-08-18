// import { test, expect } from '@playwright/test';
import dotenv from "dotenv"
dotenv.config();
import { chromium } from '@playwright/test';

const FORM_URL = process.env.FORM_URL;

if (!FORM_URL) throw new Error("FORM_URL não configurada no .env");

(async () => {
  const browser = await chromium.launch({
    headless: false,

    // Abre o Google Chrome instalado na máquina
    channel: 'chrome',

    // Deixa as ações mais fáceis de acompanhar
    slowMo: 150,
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  console.log('Abrindo formulário...');

  await page.goto(FORM_URL, {
    waitUntil: 'domcontentloaded',
  });

  /*
   * ==========================
   * DADOS PESSOAIS
   * ==========================
   */

  // Email
  await page
    .getByRole('textbox', { name: /email/i })
    .fill('mateco2503@gmail.com');

  // Nome
  const textboxes = page.getByRole('textbox');

  // Normalmente:
  // 0 = email
  // 1 = nome
  // 2 = data da sessão

  await textboxes.nth(1).fill('Mateus Araujo');

  await textboxes.nth(2).fill('17/08/2026');

  /*
   * ==========================
   * PERGUNTAS DE 1 A 10
   * ==========================
   */

  const perguntas = page.getByRole('radiogroup');

  const quantidade = await perguntas.count();

  console.log(`Encontradas ${quantidade} perguntas.`);

  let notaAnterior: number | undefined;

  for (let i = 0; i < quantidade; i++) {
    const pergunta = perguntas.nth(i);
    let nota: number;

    // Sorteia uma nota de 1 a 10.
    do {
      nota = Math.floor(Math.random() * 10) + 1;
    } while (quantidade > 1 && nota === notaAnterior);

    console.log(`Respondendo pergunta ${i + 1} com nota ${nota}`);

    await pergunta.getByRole('radio', { name: String(nota), exact: true }).click();

    notaAnterior = nota;
  }

  /*
   * ==========================
   * ENVIO
   * ==========================
   */

  console.log('Formulário preenchido. Clique em Enviar para continuar.');

  try {
    await page.waitForURL(/\/formResponse(?:[?#]|$)/, {
      waitUntil: 'commit',
      timeout: 0,
    });
  } catch (erro) {
    // Alguns scripts fecham a página logo depois que o envio é concluído.
    if (!page.isClosed()) throw erro;
  }

  console.log('Envio detectado. Fechando o navegador...');

  if (browser.isConnected()) await browser.close();
})();
