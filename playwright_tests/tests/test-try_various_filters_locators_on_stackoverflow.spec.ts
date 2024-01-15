import { test, expect } from '@playwright/test';

test('test-complicated-locator', async ({ page }) => {
  page.setViewportSize({ width: 1920, height: 1200 });

  await page.goto('https://stackoverflow.com/questions/22727107/how-to-find-the-last-field-using-cut');

  let foundCountByMultipleFilters: number = await page.locator('div.answer')
    .filter({ hasText: 'explanation' })
    .filter({ hasText: 'echo' })
    .count()
  console.log(`foundCountByMultipleFilters: ${foundCountByMultipleFilters}`)

  let foundCount: number = await page.locator('div.answer', { has: page.getByText('explanation') }).count();
  console.log(`foundCount: ${foundCount}`)

  for (const row of await page.getByRole('listitem').all()) {
    console.log(await row.textContent())
  }
  await page.pause();
});