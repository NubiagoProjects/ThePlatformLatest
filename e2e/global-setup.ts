import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Set up any global test data or authentication
  // For example, create test users, set up test data, etc.
  
  // Example: Set up authentication token
  // await page.goto('http://localhost:3000/login')
  // await page.fill('[data-testid="email"]', 'test@example.com')
  // await page.fill('[data-testid="password"]', 'password123')
  // await page.click('[data-testid="login-button"]')
  // const token = await page.evaluate(() => localStorage.getItem('auth-token'))
  
  // Store authentication state
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
  
  await browser.close()
}

export default globalSetup 