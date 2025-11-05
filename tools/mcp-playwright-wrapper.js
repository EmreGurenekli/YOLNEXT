/**
 * MCP Playwright Wrapper
 * 
 * This script provides a workaround for MCP Playwright server connection issues.
 * It directly uses Playwright to perform browser automation tasks.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let browser = null;
let page = null;

/**
 * Initialize browser connection
 */
export async function initBrowser() {
  if (browser) return browser;
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser initialized');
    return browser;
  } catch (error) {
    console.error('❌ Browser initialization failed:', error);
    throw error;
  }
}

/**
 * Navigate to a URL
 */
export async function navigate(url) {
  try {
    if (!browser) await initBrowser();
    if (!page) {
      page = await browser.newPage();
    }
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log(`✅ Navigated to ${url}`);
    return page;
  } catch (error) {
    console.error(`❌ Navigation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Take a snapshot (screenshot + accessibility tree)
 */
export async function snapshot(filename = 'snapshot.png') {
  try {
    if (!page) throw new Error('No page loaded');
    
    const screenshot = await page.screenshot({ 
      path: filename, 
      fullPage: true 
    });
    
    const title = await page.title();
    const url = page.url();
    
    console.log(`✅ Snapshot saved: ${filename}`);
    return { screenshot, title, url };
  } catch (error) {
    console.error(`❌ Snapshot failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get console messages
 */
export async function getConsoleMessages(onlyErrors = false) {
  try {
    if (!page) throw new Error('No page loaded');
    
    const messages = [];
    page.on('console', msg => {
      if (!onlyErrors || msg.type() === 'error') {
        messages.push({
          type: msg.type(),
          text: msg.text()
        });
      }
    });
    
    return messages;
  } catch (error) {
    console.error(`❌ Get console messages failed: ${error.message}`);
    throw error;
  }
}

/**
 * Click an element
 */
export async function click(selector) {
  try {
    if (!page) throw new Error('No page loaded');
    await page.click(selector);
    console.log(`✅ Clicked: ${selector}`);
  } catch (error) {
    console.error(`❌ Click failed: ${error.message}`);
    throw error;
  }
}

/**
 * Type text into an element
 */
export async function type(selector, text) {
  try {
    if (!page) throw new Error('No page loaded');
    await page.fill(selector, text);
    console.log(`✅ Typed into ${selector}`);
  } catch (error) {
    console.error(`❌ Type failed: ${error.message}`);
    throw error;
  }
}

/**
 * Close browser
 */
export async function close() {
  try {
    if (page) await page.close();
    if (browser) await browser.close();
    browser = null;
    page = null;
    console.log('✅ Browser closed');
  } catch (error) {
    console.error(`❌ Close failed: ${error.message}`);
    throw error;
  }
}

// Test function
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await initBrowser();
      await navigate('http://localhost:5173/login');
      await snapshot('test-snapshot.png');
      const title = await page.title();
      console.log(`Page title: ${title}`);
      await close();
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  })();
}


