import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Nubiago/)
    
    // Check for main navigation elements
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    
    // Check for key sections
    await expect(page.getByRole('heading', { name: /Nubiago/i })).toBeVisible()
  })

  test('product listing page loads', async ({ page }) => {
    await page.goto('/products')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Products/)
    
    // Check for product grid or list
    await expect(page.locator('[data-testid="products-grid"], [data-testid="products-list"]')).toBeVisible()
  })

  test('product detail page loads', async ({ page }) => {
    await page.goto('/product/1')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Wireless Bluetooth Headphones/)
    
    // Check for product information
    await expect(page.getByText('Wireless Bluetooth Headphones')).toBeVisible()
    await expect(page.getByText('AudioTech')).toBeVisible()
    await expect(page.getByText(/\$89\.99/)).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Login/)
    
    // Check for login form
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('cart page loads', async ({ page }) => {
    await page.goto('/cart')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Cart/)
    
    // Check for cart elements
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible()
  })

  test('checkout flow starts', async ({ page }) => {
    await page.goto('/checkout')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Checkout/)
    
    // Check for checkout form elements
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible()
  })

  test('search functionality works', async ({ page }) => {
    await page.goto('/')
    
    // Find search input
    const searchInput = page.getByRole('searchbox', { name: /search products/i })
    await expect(searchInput).toBeVisible()
    
    // Type in search query
    await searchInput.fill('headphones')
    await searchInput.press('Enter')
    
    // Should navigate to products page with search query
    await expect(page).toHaveURL(/\/products\?search=headphones/)
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation to products
    await page.getByRole('link', { name: /products/i }).click()
    await expect(page).toHaveURL('/products')
    
    // Test navigation to categories
    await page.getByRole('link', { name: /categories/i }).click()
    await expect(page).toHaveURL('/categories')
    
    // Test navigation back to home
    await page.getByRole('link', { name: /home/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that mobile navigation is available
    await expect(page.locator('header')).toBeVisible()
    
    // Check that content is properly sized for mobile
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('accessibility features work', async ({ page }) => {
    await page.goto('/')
    
    // Check for skip link
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    await expect(headings).toHaveCount(expect.any(Number))
  })

  test('error pages work', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    
    // Should show 404 page
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /go back home/i })).toBeVisible()
  })
}) 