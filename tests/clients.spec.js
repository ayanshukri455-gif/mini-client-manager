import { test, expect } from '@playwright/test';

const storageKey = 'mini-client-manager-clients-v1';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.removeItem(key), storageKey);
  await page.goto('/');
});

async function addClient(page, { name, company, email }) {
  await page.locator('#open-modal').click();
  await page.getByLabel('Име и фамилия').fill(name);
  await page.getByLabel('Фирма').fill(company);
  await page.getByLabel('Имейл адрес').fill(email);
  await page.getByRole('button', { name: /Запази клиента/ }).click();
}

test('добавя нов клиент и го показва в таблицата', async ({ page }) => {
  await addClient(page, {
    name: 'Тест Клиент',
    company: 'Test Company',
    email: 'test.client@example.com'
  });

  const row = page.locator('#client-table tr').filter({ hasText: 'test.client@example.com' });
  await expect(row).toContainText('Тест Клиент');
  await expect(row).toContainText('Test Company');
  await expect(page.locator('#total-clients')).toHaveText('6');
});

test('редактира съществуващ клиент', async ({ page }) => {
  const row = page.locator('#client-table tr').filter({ hasText: 'maria@brightstudio.example' });
  await row.getByRole('button', { name: 'Редактирай Мария Николова' }).click();
  await page.getByLabel('Име и фамилия').fill('Мария Тестова');
  await page.getByLabel('Фирма').fill('Updated Studio');
  await page.getByLabel('Имейл адрес').fill('maria.updated@example.com');
  await page.getByRole('button', { name: /Запази промените/ }).click();

  await expect(page.locator('#client-table')).toContainText('Мария Тестова');
  await expect(page.locator('#client-table')).toContainText('maria.updated@example.com');
  await expect(page.locator('#client-table')).not.toContainText('maria@brightstudio.example');
});

test('изтрива клиент след потвърждение', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  const row = page.locator('#client-table tr').filter({ hasText: 'maria@brightstudio.example' });
  await row.getByRole('button', { name: 'Изтрий Мария Николова' }).click();

  await expect(page.locator('#client-table')).not.toContainText('maria@brightstudio.example');
  await expect(page.locator('#total-clients')).toHaveText('4');
});

test('запазва добавените данни след презареждане', async ({ page }) => {
  await addClient(page, {
    name: 'Запазен Клиент',
    company: 'Persistent Ltd',
    email: 'persistent@example.com'
  });
  await page.reload();

  const row = page.locator('#client-table tr').filter({ hasText: 'persistent@example.com' });
  await expect(row).toContainText('Запазен Клиент');
  await expect(row).toContainText('Persistent Ltd');
});

test('не допуска дублиран имейл, независимо от главни и малки букви', async ({ page }) => {
  await page.locator('#open-modal').click();
  await page.getByLabel('Име и фамилия').fill('Друг Клиент');
  await page.getByLabel('Фирма').fill('Other Company');
  await page.getByLabel('Имейл адрес').fill('MARIA@BRIGHTSTUDIO.EXAMPLE');
  await page.getByRole('button', { name: /Запази клиента/ }).click();

  await expect(page.locator('#form-error')).toHaveText('Вече има клиент с този имейл адрес.');
  await expect(page.locator('#client-table tr')).toHaveCount(5);
});
