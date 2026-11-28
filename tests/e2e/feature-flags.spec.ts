import { expect, test } from '@playwright/test';

test('admin toggles website maintenance', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('admin_token','admin-token'); localStorage.setItem('admin_info',JSON.stringify({email:'admin@example.com',name:'Admin'})); });
  let enabled = false;
  await page.route('**/api/v1/admin/feature-flags', route => route.fulfill({ status: 200, contentType:'application/json', body:JSON.stringify({flags:{website_maintenance:enabled}}) }));
  await page.route('**/api/v1/admin/feature-flags/website_maintenance', async route => { enabled=route.request().postDataJSON().enabled; await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({key:'website_maintenance',enabled})}); });
  await page.goto('/feature-flags');
  const toggle=page.getByRole('switch',{name:'Toggle website_maintenance'});
  await expect(toggle).toHaveAttribute('aria-checked','false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked','true');
});
