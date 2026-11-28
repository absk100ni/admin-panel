import { expect, Page, test } from '@playwright/test';

const product = {
  id: 'product-1', slug: 'led-work-light', name: '20W LED Work Light',
  description: 'Portable work light', category: 'lighting', price: 129900,
  compare_at_price: 149900, stock: 0, weight: 850, length_cm: 24, width_cm: 18, height_cm: 12, gst_percent: 18, hsn_code: '9405', sku: 'LGT-WORK-20W',
  is_active: true, thumbnail: '', images: [], tags: [], advance_percent: 20,
};

async function mockAdminApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = request.method();
    const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });

    if (path === '/admin/auth/login' && method === 'POST') return json({ token: 'admin-token', admin: { email: 'admin@example.com', name: 'Store Admin' } });
    if (path === '/admin/stats') return json({ total_users: 3, total_orders: 2, total_products: 1, total_revenue: 129900 });
    if (path === '/admin/analytics/revenue') return json({ total_revenue: 129900, total_paid_orders: 1, avg_order_value: 129900, daily_revenue: [{ date: '2026-11-14', revenue: 129900, orders: 1 }], status_breakdown: { confirmed: 1 }, payment_breakdown: { paid: 1 }, top_products: [{ name: product.name, quantity: 1 }] });
    if (path === '/admin/products' && method === 'GET') return json({ products: [product], total: 1, page: 1, total_pages: 1 });
    if (path === '/admin/products/product-1' && method === 'PUT') return json({ message: 'Product updated' });
    if (path === '/admin/products/export-csv' && method === 'GET') return route.fulfill({ status: 200, contentType: 'text/csv', headers: { 'Content-Disposition': 'attachment; filename=products.csv' }, body: 'name,stock\n20W LED Work Light,0\n' });
    if (path === '/categories/tree') return json({ categories: [{ id: 'cat-1', name: 'Lighting', slug: 'lighting', level: 1, is_active: true, children: [] }] });
    if (path === '/admin/orders' && method === 'GET') return json({ orders: [{ id: 'order-1', order_number: 'ORD-20001', status: 'confirmed', payment_status: 'paid', payment_plan: 'full', total: 129900, advance_amount: 129900, cod_amount: 0, refund_amount: 0, created_at: '2026-11-14T10:00:00Z', items: [{ product_id: product.id, name: product.name, quantity: 1, price: product.price }], shipping_address: { name: 'A Customer', phone: '9999999999', line1: '10 Market Road', city: 'Faridabad', state: 'Haryana', pincode: '121003' } }], total: 1 });
    if (path === '/admin/orders/order-1' && method === 'GET') return json({ id: 'order-1', order_number: 'ORD-20001', status: 'confirmed', payment_status: 'paid', payment_plan: 'full', payment_id: 'pay_1', total: 129900, advance_amount: 129900, cod_amount: 0, refund_amount: 0, created_at: '2026-11-14T10:00:00Z', items: [{ product_id: product.id, name: product.name, quantity: 1, price: product.price }], shipping_address: { name: 'A Customer', phone: '9999999999', line1: '10 Market Road', city: 'Faridabad', state: 'Haryana', pincode: '121003' } });
    if (path === '/admin/orders/order-1/refund' && method === 'POST') return json({ message: 'Refund processed', refund_id: 'rfnd_1', refund_amount: 129900 });
    if (path === '/admin/orders/order-1/push-shipmozo' && method === 'POST') return json({ status: 'awaiting_courier', provider_order_id: 'SMZ-1', message: 'Order pushed to Shipmozo' }, 201);
    if (path === '/admin/reviews' && method === 'GET') return json({ reviews: [{ id: 'review-1', product_id: product.id, user_name: 'A Customer', rating: 4, comment: 'Useful on site', is_verified: true, is_approved: false }] });
    if (path === '/admin/reviews/review-1/approve' && method === 'PUT') return json({ message: 'Review approval updated' });
    if (path === '/admin/returns' && method === 'GET') return json({ return_requests: [{ id: 'return-1', order_id: 'order-1', user_id: 'user-1', type: 'return', status: 'requested', comment: 'Damaged', items: [{ product_id: product.id, qty: 1, reason: 'Damaged' }], created_at: '2026-11-14T10:00:00Z' }] });
    if (path === '/admin/returns/return-1' && method === 'PUT') return json({ message: 'Return request updated', status: 'approved' });
    if (path === '/admin/contact-messages' && method === 'GET') return json({ contact_messages: [{ id: 'message-1', name: 'A Customer', email: 'customer@example.com', phone: '', subject: 'Product question', message: 'Does this include a cable?', status: 'open', created_at: '2026-11-14T10:00:00Z' }] });
    if (path === '/admin/contact-messages/message-1' && method === 'PUT') return json({ message: 'Contact message updated', status: 'resolved' });
    if (path === '/admin/users' && method === 'GET') return json({ users: [{ id: 'user-1', name: 'A Customer', email: 'customer@example.com', phone: '9999999999', created_at: '2026-11-14T10:00:00Z' }] });
    if (path === '/admin/coupons' && method === 'GET') return json({ coupons: [] });
    if (path === '/admin/ops/status' && method === 'GET') return json({ service: 'ecom-core-service', environment: 'production', configuration: [{ name: 'payment', required: true, ready: true, detail: 'Payment configuration is ready' }], active_anomalies: { critical: 1, high: 0 }, monitor_interval_minutes: 5 });
    if (path === '/admin/ops/anomalies' && method === 'GET') return json({ anomalies: [{ key: 'OPS_REFUND_PENDING_STALE:order-1', event_code: 'OPS_REFUND_PENDING_STALE', severity: 'critical', resource_type: 'order', resource_id: 'order-1', summary: 'Refund remains pending beyond the reconciliation window', recommendation: 'Compare the refund with the payment provider before retrying', age_seconds: 7200 }], total: 1, page: 1, limit: 50 });
    if (path === '/admin/ops/audit' && method === 'GET') return json({ audit_events: [{ id: 'audit-1', timestamp: '2026-11-16T10:00:00Z', actor_email: 'admin@example.com', request_id: 'req-1', action: 'order.refund', resource_type: 'order', resource_id: 'order-1', outcome: 'succeeded' }], total: 1, page: 1, limit: 25 });
    return json({ error: `Unhandled admin test route ${method} ${path}` }, 404);
  });
}

async function authenticate(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'admin-token');
    localStorage.setItem('admin_info', JSON.stringify({ email: 'admin@example.com', name: 'Store Admin' }));
  });
}

test.beforeEach(async ({ page }) => {
  await mockAdminApi(page);
});

test('admin can sign in and see collected revenue', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('admin@example.com').fill('admin@example.com');
  await page.getByPlaceholder('••••••••').fill('correct-password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('₹1,299').first()).toBeVisible();
});

test('editing zero-stock product preserves zero', async ({ page }) => {
  await authenticate(page);
  let submittedStock: number | undefined;
  await page.route('**/api/v1/admin/products/product-1', async (route) => {
    submittedStock = route.request().postDataJSON().stock;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Product updated' }) });
  });
  await page.goto('/products');
  await page.getByTitle('Edit product').click();
  await page.getByRole('button', { name: 'Update Product' }).click();
  await expect.poll(() => submittedStock).toBe(0);
});

test('catalog export carries the admin token', async ({ page }) => {
  await authenticate(page);
  let authorization = '';
  await page.route('**/api/v1/admin/products/export-csv', async (route) => {
    authorization = route.request().headers().authorization || '';
    await route.fulfill({ status: 200, contentType: 'text/csv', headers: { 'Content-Disposition': 'attachment; filename=products.csv' }, body: 'name,stock\n20W LED Work Light,0\n' });
  });
  await page.goto('/products');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  await downloadPromise;
  expect(authorization).toBe('Bearer admin-token');
});

test('refund action sends the reviewed amount', async ({ page }) => {
  await authenticate(page);
  let refundAmount = 0;
  await page.route('**/api/v1/admin/orders/order-1/refund', async (route) => {
    refundAmount = route.request().postDataJSON().amount;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Refund processed', refund_id: 'rfnd_1', refund_amount: refundAmount }) });
  });
  await page.goto('/orders/order-1');
  await page.getByRole('button', { name: 'Process Refund' }).click();
  await expect(page.getByText('Paid amount: ₹1,299')).toBeVisible();
  await page.getByRole('button', { name: 'Refund ₹1299' }).click();
  await expect.poll(() => refundAmount).toBe(129900);
});

test('Shipmozo push requires confirmation and does not assign courier', async ({ page }) => {
  await authenticate(page);
  let shipmentCalls = 0;
  await page.route('**/api/v1/admin/orders/order-1/push-shipmozo', async (route) => {
    shipmentCalls++;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: 'awaiting_courier', provider_order_id: 'SMZ-1' }) });
  });
  await page.goto('/orders/order-1');
  await page.getByRole('button', { name: 'Push to Shipmozo' }).click();
  expect(shipmentCalls).toBe(0);
  await page.getByRole('button', { name: 'Push Only' }).click();
  await expect.poll(() => shipmentCalls).toBe(1);
});

test('return approval is explicit and does not call refund', async ({ page }) => {
  await authenticate(page);
  let approvalCalls = 0;
  let refundCalls = 0;
  page.on('request', (request) => {
    if (request.url().includes('/refund')) refundCalls++;
  });
  await page.route('**/api/v1/admin/returns/return-1', async (route) => {
    approvalCalls++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'updated', status: 'approved' }) });
  });
  await page.goto('/returns');
  await page.getByTitle('Approve').click();
  await page.getByRole('button', { name: 'Approve', exact: true }).last().click();
  await expect.poll(() => approvalCalls).toBe(1);
  expect(refundCalls).toBe(0);
});

test('contact message can be marked resolved', async ({ page }) => {
  await authenticate(page);
  await page.goto('/messages');
  await expect(page.getByText('Does this include a cable?')).toBeVisible();
  await page.getByTitle('Mark Resolved').click();
  await expect(page.getByText('Message marked as resolved')).toBeVisible();
});


test('pending customer review requires an explicit publish action', async ({ page }) => {
  await authenticate(page);
  let approved = false;
  await page.route('**/api/v1/admin/reviews/review-1/approve', async (route) => {
    approved = route.request().postDataJSON().is_approved;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Review approval updated' }) });
  });
  await page.goto('/reviews');
  await expect(page.getByText('Useful on site')).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect.poll(() => approved).toBe(true);
  await expect(page.getByText('Useful on site')).toHaveCount(0);
});


test('operations page shows readiness, anomalies and audit evidence', async ({ page }) => {
  await authenticate(page);
  await page.goto('/operations');
  await expect(page.getByRole('heading', { name: 'Operations readiness' })).toBeVisible();
  await expect(page.getByText('OPS_REFUND_PENDING_STALE')).toBeVisible();
  await expect(page.getByText('order.refund')).toBeVisible();
  await expect(page.getByText('req-1')).toBeVisible();
});
