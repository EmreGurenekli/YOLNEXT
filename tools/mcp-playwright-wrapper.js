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
const consoleMessages = [];

/**
 * Get the current page instance
 */
export function getPage() {
  if (!page) {
    throw new Error('Page not initialized. Call navigate() first.');
  }
  return page;
}

/**
 * Initialize browser connection
 */
export async function initBrowser(options = {}) {
  if (browser) return browser;
  
  try {
    browser = await chromium.launch({ 
      headless: options.headless !== false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', ...(options.args || [])]
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
export async function navigate(url, options = {}) {
  try {
    if (!browser) await initBrowser();
    if (!page) {
      page = await browser.newPage();
      
      // Setup console message collection
      consoleMessages.length = 0; // Clear previous messages
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now()
        });
      });
      
      // Setup error handling
      page.on('pageerror', error => {
        consoleMessages.push({
          type: 'error',
          text: error.message,
          timestamp: Date.now()
        });
      });
    }
    
    const waitUntil = options.waitUntil || 'networkidle';
    const timeout = options.timeout || 30000;
    
    await page.goto(url, { waitUntil, timeout });
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
    
    if (onlyErrors) {
      return consoleMessages.filter(msg => msg.type === 'error');
    }
    
    return [...consoleMessages]; // Return copy
  } catch (error) {
    console.error(`❌ Get console messages failed: ${error.message}`);
    throw error;
  }
}

/**
 * Wait for element to be visible
 */
export async function waitForSelector(selector, options = {}) {
  try {
    if (!page) throw new Error('No page loaded');
    const timeout = options.timeout || 10000;
    await page.waitForSelector(selector, { state: 'visible', timeout });
    console.log(`✅ Element visible: ${selector}`);
    return true;
  } catch (error) {
    console.error(`❌ Wait for selector failed: ${error.message}`);
    throw error;
  }
}

/**
 * Wait for navigation or timeout
 */
export async function waitForNavigation(options = {}) {
  try {
    if (!page) throw new Error('No page loaded');
    const timeout = options.timeout || 30000;
    await page.waitForLoadState('networkidle', { timeout });
    console.log('✅ Navigation completed');
    return true;
  } catch (error) {
    console.error(`❌ Wait for navigation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Click an element with retry logic
 */
export async function click(selector, options = {}) {
  try {
    if (!page) throw new Error('No page loaded');
    
    const timeout = options.timeout || 10000;
    const retries = options.retries || 3;
    
    // Wait for element to be visible first
    await waitForSelector(selector, { timeout });
    
    for (let i = 0; i < retries; i++) {
      try {
        await page.click(selector, { timeout });
        console.log(`✅ Clicked: ${selector}`);
        
        // Wait a bit for any navigation or state changes
        if (options.waitAfter) {
          await page.waitForTimeout(options.waitAfter);
        }
        
        return true;
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(500);
      }
    }
  } catch (error) {
    console.error(`❌ Click failed: ${error.message}`);
    throw error;
  }
}

/**
 * Type text into an element
 */
export async function type(selector, text, options = {}) {
  try {
    if (!page) throw new Error('No page loaded');
    
    const timeout = options.timeout || 10000;
    
    // Wait for element to be visible first
    await waitForSelector(selector, { timeout });
    
    // Clear existing text if needed
    if (options.clear !== false) {
      await page.fill(selector, '');
    }
    
    // Type text
    await page.type(selector, text, { delay: options.delay || 50 });
    console.log(`✅ Typed into ${selector}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Type failed: ${error.message}`);
    throw error;
  }
}

/**
 * Wait for a specific amount of time
 */
export async function waitFor(ms) {
  if (!page) throw new Error('No page loaded');
  await page.waitForTimeout(ms);
  return true;
}

/**
 * Close browser
 */
export async function close() {
  try {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore if already closed
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore if already closed
      }
    }
    browser = null;
    page = null;
    consoleMessages.length = 0;
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


