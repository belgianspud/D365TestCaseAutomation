/**
 * Base Playwright test template for D365 Test Platform
 * This template is used to generate test files from JSON test definitions
 */

const { test, expect } = require('@playwright/test');

class D365TestRunner {
    constructor(page) {
        this.page = page;
        this.defaultTimeout = 30000;
        this.retryCount = 3;
    }

    async navigateToUrl(url) {
        console.log(`Navigating to: ${url}`);
        await this.page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: this.defaultTimeout 
        });
        
        // Wait for D365 to fully load
        await this.page.waitForLoadState('domcontentloaded');
        
        // Check if we're on a login page
        const isLoginPage = await this.page.locator('input[type="email"], input[type="password"]').count() > 0;
        if (isLoginPage) {
            console.log('Login page detected - may require authentication');
        }
    }

    async clickElement(selector, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        console.log(`Clicking element: ${selector}`);
        
        // Wait for element to be visible and enabled
        await this.page.waitForSelector(selector, { 
            state: 'visible',
            timeout: timeout 
        });
        
        // Scroll element into view if needed
        await this.page.locator(selector).scrollIntoViewIfNeeded();
        
        // Click with retry logic
        for (let i = 0; i < this.retryCount; i++) {
            try {
                await this.page.click(selector, { timeout: 5000 });
                break;
            } catch (error) {
                if (i === this.retryCount - 1) throw error;
                console.log(`Click attempt ${i + 1} failed, retrying...`);
                await this.page.waitForTimeout(1000);
            }
        }
    }

    async fillField(selector, value, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        console.log(`Filling field ${selector} with: ${value}`);
        
        // Wait for field to be visible
        await this.page.waitForSelector(selector, { 
            state: 'visible',
            timeout: timeout 
        });
        
        // Clear existing value and fill
        await this.page.fill(selector, '');
        await this.page.fill(selector, value);
        
        // Trigger change event for D365 compatibility
        await this.page.dispatchEvent(selector, 'change');
        await this.page.dispatchEvent(selector, 'blur');
    }

    async verifyElement(selector, expectedState, expectedText = null, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        console.log(`Verifying element: ${selector} - Expected state: ${expectedState}`);
        
        const element = this.page.locator(selector);
        
        switch (expectedState.toLowerCase()) {
            case 'visible':
                await expect(element).toBeVisible({ timeout });
                break;
                
            case 'hidden':
                await expect(element).toBeHidden({ timeout });
                break;
                
            case 'enabled':
                await expect(element).toBeEnabled({ timeout });
                break;
                
            case 'disabled':
                await expect(element).toBeDisabled({ timeout });
                break;
                
            case 'text':
                if (expectedText) {
                    await expect(element).toHaveText(expectedText, { timeout });
                } else {
                    throw new Error('Expected text must be provided for text verification');
                }
                break;
                
            case 'contains':
                if (expectedText) {
                    await expect(element).toContainText(expectedText, { timeout });
                } else {
                    throw new Error('Expected text must be provided for contains verification');
                }
                break;
                
            default:
                throw new Error(`Unknown verification state: ${expectedState}`);
        }
    }

    async waitForElement(selector, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        const state = options.state || 'visible';
        
        console.log(`Waiting for element: ${selector} to be ${state}`);
        await this.page.waitForSelector(selector, { 
            state: state,
            timeout: timeout 
        });
    }

    async waitForTimeout(milliseconds) {
        console.log(`Waiting for ${milliseconds}ms`);
        await this.page.waitForTimeout(milliseconds);
    }

    async takeScreenshot(path) {
        console.log(`Taking screenshot: ${path}`);
        await this.page.screenshot({ 
            path: path,
            fullPage: true 
        });
    }

    async waitForD365Ready() {
        console.log('Waiting for D365 to be ready...');
        
        // Wait for common D365 elements to indicate the page is loaded
        try {
            await this.page.waitForSelector('[data-id="navbar-container"], .ms-Nav', { 
                timeout: 30000 
            });
            
            // Wait for any loading indicators to disappear
            await this.page.waitForSelector('.loading, .spinner, [aria-label*="Loading"]', { 
                state: 'hidden',
                timeout: 10000 
            }).catch(() => {
                // Ignore if no loading indicators found
            });
            
            console.log('D365 appears to be ready');
        } catch (error) {
            console.log('D365 ready check failed, continuing anyway');
        }
    }

    async handleD365Popup() {
        // Handle common D365 popups like notifications, warnings, etc.
        try {
            const closeButtons = [
                '[data-id="closeButton"]',
                '[aria-label="Close"]',
                '.ms-MessageBar-dismissal',
                '[title="Close"]'
            ];
            
            for (const selector of closeButtons) {
                const element = await this.page.locator(selector);
                if (await element.count() > 0) {
                    await element.click();
                    console.log(`Closed popup with selector: ${selector}`);
                }
            }
        } catch (error) {
            // Ignore popup handling errors
        }
    }

    async selectFromDropdown(selector, optionText, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        console.log(`Selecting "${optionText}" from dropdown: ${selector}`);
        
        // Click to open dropdown
        await this.clickElement(selector, { timeout });
        
        // Wait for dropdown options to appear
        await this.page.waitForTimeout(500);
        
        // Try different option selectors common in D365
        const optionSelectors = [
            `[aria-label="${optionText}"]`,
            `[title="${optionText}"]`,
            `text="${optionText}"`,
            `[data-text="${optionText}"]`
        ];
        
        let optionFound = false;
        for (const optionSelector of optionSelectors) {
            try {
                await this.page.click(optionSelector, { timeout: 2000 });
                optionFound = true;
                break;
            } catch (error) {
                continue;
            }
        }
        
        if (!optionFound) {
            throw new Error(`Could not find option "${optionText}" in dropdown`);
        }
    }

    async navigateToEntity(entityName, viewName = null) {
        console.log(`Navigating to entity: ${entityName}${viewName ? ` (${viewName} view)` : ''}`);
        
        // Use D365 site map navigation
        await this.clickElement('[data-id="navbar-expand-btn"]').catch(() => {
            // Ignore if navigation is already expanded
        });
        
        await this.waitForTimeout(500);
        
        // Look for entity in site map
        const entitySelector = `[data-id*="${entityName}"], [aria-label*="${entityName}"]`;
        await this.clickElement(entitySelector);
        
        if (viewName) {
            await this.waitForTimeout(1000);
            await this.selectFromDropdown('[data-id="ViewSelector"]', viewName).catch(() => {
                console.log(`Could not select view "${viewName}", using default view`);
            });
        }
        
        await this.waitForD365Ready();
    }

    async createNewRecord(entityName) {
        console.log(`Creating new ${entityName} record`);
        
        // Click New button (common in D365)
        const newButtonSelectors = [
            '[data-id="new-record-button"]',
            '[aria-label*="New"]',
            '[title*="New"]',
            'button:has-text("New")'
        ];
        
        for (const selector of newButtonSelectors) {
            try {
                await this.clickElement(selector, { timeout: 5000 });
                break;
            } catch (error) {
                continue;
            }
        }
        
        await this.waitForD365Ready();
    }

    async saveRecord() {
        console.log('Saving record');
        
        // Try different save button selectors
        const saveButtonSelectors = [
            '[data-id="save-button"]',
            '[aria-label*="Save"]',
            '[title*="Save"]',
            'button:has-text("Save")'
        ];
        
        for (const selector of saveButtonSelectors) {
            try {
                await this.clickElement(selector, { timeout: 5000 });
                break;
            } catch (error) {
                continue;
            }
        }
        
        // Wait for save completion
        await this.waitForTimeout(2000);
        await this.waitForD365Ready();
    }
}

// Export the test runner class for use in generated tests
module.exports = { D365TestRunner };

// Example test template that can be customized for specific test cases
function generateTestTemplate(testName, testSteps) {
    return `
const { test, expect } = require('@playwright/test');
const { D365TestRunner } = require('./base_test');

test('${testName}', async ({ page }) => {
    const runner = new D365TestRunner(page);
    
    try {
        ${testSteps.map((step, index) => generateStepCode(step, index)).join('\n        ')}
        
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error.message);
        
        // Take screenshot on failure
        await runner.takeScreenshot(\`failure-\${Date.now()}.png\`);
        throw error;
    }
});
`;
}

function generateStepCode(step, index) {
    const stepComment = `// Step ${index + 1}: ${step.description || step.type}`;
    
    switch (step.type) {
        case 'navigate':
            return `${stepComment}
        await runner.navigateToUrl('${step.value}');`;
            
        case 'click':
            return `${stepComment}
        await runner.clickElement('${step.selector}', { timeout: ${step.timeout || 30000} });`;
            
        case 'fill':
            return `${stepComment}
        await runner.fillField('${step.selector}', '${step.value}', { timeout: ${step.timeout || 30000} });`;
            
        case 'verify':
            if (step.expected === 'visible' || step.expected === 'hidden') {
                return `${stepComment}
        await runner.verifyElement('${step.selector}', '${step.expected}', null, { timeout: ${step.timeout || 30000} });`;
            } else {
                return `${stepComment}
        await runner.verifyElement('${step.selector}', 'text', '${step.expected}', { timeout: ${step.timeout || 30000} });`;
            }
            
        case 'wait':
            return `${stepComment}
        await runner.waitForTimeout(${step.value || 1000});`;
            
        case 'waitForSelector':
            return `${stepComment}
        await runner.waitForElement('${step.selector}', { timeout: ${step.timeout || 30000} });`;
            
        case 'screenshot':
            return `${stepComment}
        await runner.takeScreenshot('screenshot-step-${index + 1}.png');`;
            
        default:
            return `${stepComment}
        console.log('Unknown step type: ${step.type}');`;
    }
}

// Export template generation function
module.exports.generateTestTemplate = generateTestTemplate;
`;
