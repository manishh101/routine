// Test script to verify the Manage Classes button functionality
const puppeteer = require('puppeteer');

async function testManageClassesButton() {
  console.log('🧪 Testing Manage Classes Button Functionality\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI/CD
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (type === 'warn') {
        console.log(`⚠️  Console Warning: ${msg.text()}`);
      }
    });
    
    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if login is required
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('login')) {
      console.log('🔐 Login required. Please log in manually and run the test again.');
      await page.waitForTimeout(10000); // Give time for manual login
    }
    
    // Look for routine-related elements
    await page.waitForSelector('[data-testid="routine-grid"], .routine-grid, .ant-card', { timeout: 5000 });
    console.log('✅ Routine grid found');
    
    // Look for the Manage Classes button
    const manageClassesButton = await page.$('button:has-text("Manage Classes"), [aria-label*="Manage"], button[title*="Manage"]');
    
    if (manageClassesButton) {
      console.log('✅ Manage Classes button found');
      
      // Click the button and test for errors
      try {
        await manageClassesButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Manage Classes button clicked successfully');
        
        // Check if modal appeared
        const modal = await page.$('.ant-modal, .ant-modal-content');
        if (modal) {
          console.log('✅ Modal appeared successfully');
        } else {
          console.log('❌ Modal did not appear');
        }
        
      } catch (error) {
        console.log(`❌ Error clicking Manage Classes button: ${error.message}`);
      }
    } else {
      console.log('❌ Manage Classes button not found');
    }
    
    console.log('\n📊 Test completed');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testManageClassesButton();
}

module.exports = { testManageClassesButton };
