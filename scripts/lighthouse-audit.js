const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = './lighthouse-reports'

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}

// Pages to audit
const pages = [
  { name: 'homepage', url: '/' },
  { name: 'products', url: '/products' },
  { name: 'product-detail', url: '/product/1' },
  { name: 'login', url: '/login' },
  { name: 'cart', url: '/cart' },
  { name: 'checkout', url: '/checkout' }
]

async function runLighthouseAudit(pageName, pageUrl) {
  console.log(`\n🔍 Running Lighthouse audit for ${pageName}...`)
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] })
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
    ...lighthouseConfig
  }

  try {
    const runnerResult = await lighthouse(`${BASE_URL}${pageUrl}`, options)
    const reportJson = runnerResult.lhr

    // Save detailed JSON report
    const jsonPath = path.join(OUTPUT_DIR, `${pageName}-lighthouse-report.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(reportJson, null, 2))

    // Save HTML report
    const htmlPath = path.join(OUTPUT_DIR, `${pageName}-lighthouse-report.html`)
    fs.writeFileSync(htmlPath, runnerResult.report)

    // Extract scores
    const scores = {
      performance: Math.round(reportJson.categories.performance.score * 100),
      accessibility: Math.round(reportJson.categories.accessibility.score * 100),
      'best-practices': Math.round(reportJson.categories['best-practices'].score * 100),
      seo: Math.round(reportJson.categories.seo.score * 100)
    }

    console.log(`✅ ${pageName} audit completed:`)
    console.log(`   Performance: ${scores.performance}/100`)
    console.log(`   Accessibility: ${scores.accessibility}/100`)
    console.log(`   Best Practices: ${scores['best-practices']}/100`)
    console.log(`   SEO: ${scores.seo}/100`)

    // Check for critical issues
    const criticalIssues = []
    Object.entries(reportJson.audits).forEach(([key, audit]) => {
      if (audit.score !== null && audit.score < 0.9 && audit.details && audit.details.type === 'opportunity') {
        criticalIssues.push({
          id: key,
          title: audit.title,
          score: audit.score,
          description: audit.description
        })
      }
    })

    if (criticalIssues.length > 0) {
      console.log(`⚠️  Critical issues found for ${pageName}:`)
      criticalIssues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue.title} (Score: ${Math.round(issue.score * 100)})`)
      })
    }

    return {
      pageName,
      scores,
      criticalIssues: criticalIssues.length,
      reports: {
        json: jsonPath,
        html: htmlPath
      }
    }

  } catch (error) {
    console.error(`❌ Error auditing ${pageName}:`, error.message)
    return {
      pageName,
      error: error.message
    }
  } finally {
    await chrome.kill()
  }
}

async function runAllAudits() {
  console.log('🚀 Starting Lighthouse audits...')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Output directory: ${OUTPUT_DIR}`)

  const results = []
  const summary = {
    totalPages: pages.length,
    successfulAudits: 0,
    averageScores: {
      performance: 0,
      accessibility: 0,
      'best-practices': 0,
      seo: 0
    }
  }

  for (const page of pages) {
    const result = await runLighthouseAudit(page.name, page.url)
    results.push(result)

    if (!result.error) {
      summary.successfulAudits++
      summary.averageScores.performance += result.scores.performance
      summary.averageScores.accessibility += result.scores.accessibility
      summary.averageScores['best-practices'] += result.scores['best-practices']
      summary.averageScores.seo += result.scores.seo
    }

    // Add delay between audits to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Calculate averages
  if (summary.successfulAudits > 0) {
    summary.averageScores.performance = Math.round(summary.averageScores.performance / summary.successfulAudits)
    summary.averageScores.accessibility = Math.round(summary.averageScores.accessibility / summary.successfulAudits)
    summary.averageScores['best-practices'] = Math.round(summary.averageScores['best-practices'] / summary.successfulAudits)
    summary.averageScores.seo = Math.round(summary.averageScores.seo / summary.successfulAudits)
  }

  // Generate summary report
  console.log('\n📊 Lighthouse Audit Summary')
  console.log('=' .repeat(50))
  console.log(`Total pages audited: ${summary.totalPages}`)
  console.log(`Successful audits: ${summary.successfulAudits}`)
  console.log(`Failed audits: ${summary.totalPages - summary.successfulAudits}`)
  console.log('\nAverage Scores:')
  console.log(`  Performance: ${summary.averageScores.performance}/100`)
  console.log(`  Accessibility: ${summary.averageScores.accessibility}/100`)
  console.log(`  Best Practices: ${summary.averageScores['best-practices']}/100`)
  console.log(`  SEO: ${summary.averageScores.seo}/100`)

  // Save summary report
  const summaryPath = path.join(OUTPUT_DIR, 'lighthouse-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify({ summary, results }, null, 2))
  console.log(`\n📄 Summary report saved to: ${summaryPath}`)

  // Check if scores meet minimum thresholds
  const thresholds = {
    performance: 90,
    accessibility: 90,
    'best-practices': 90,
    seo: 90
  }

  const failedThresholds = []
  Object.entries(summary.averageScores).forEach(([category, score]) => {
    if (score < thresholds[category]) {
      failedThresholds.push(`${category}: ${score}/${thresholds[category]}`)
    }
  })

  if (failedThresholds.length > 0) {
    console.log('\n❌ Some scores are below thresholds:')
    failedThresholds.forEach(failed => console.log(`  - ${failed}`))
    process.exit(1)
  } else {
    console.log('\n✅ All scores meet minimum thresholds!')
  }
}

// Run the audits
runAllAudits().catch(console.error) 