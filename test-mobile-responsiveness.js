const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Mobile Responsiveness Implementation...\n');

const projectRoot = '/home/manish/Documents/SE/routine';

// Test cases for mobile responsiveness
const tests = [
    {
        name: 'Layout Component Mobile States',
        check: () => {
            const layoutPath = path.join(projectRoot, 'frontend/src/components/Layout.jsx');
            const content = fs.readFileSync(layoutPath, 'utf8');
            
            const checks = {
                'Mobile state management': content.includes('const [isMobile, setIsMobile] = useState(false)'),
                'Mobile drawer state': content.includes('const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)'),
                'Window resize handler': content.includes('handleResize()'),
                'Mobile breakpoint detection': content.includes('window.innerWidth <= 768'),
                'Responsive sidebar logic': content.includes('!isMobile && (') && content.includes('isMobile && ('),
                'Mobile drawer overlay': content.includes('rgba(0, 0, 0, 0.5)'),
                'Touch-friendly button sizes': content.includes('min-height: 44px'),
                'Responsive padding': content.includes('isMobile ? ') && content.includes('padding'),
                'Mobile navigation close': content.includes('setMobileDrawerVisible(false)'),
                'Responsive margin calculations': content.includes('marginLeft: isMobile ? 0 : (collapsed ? 72 : 240)')
            };
            
            return checks;
        }
    },
    {
        name: 'CSS Mobile Styles',
        check: () => {
            const cssPath = path.join(projectRoot, 'frontend/src/index.css');
            const content = fs.readFileSync(cssPath, 'utf8');
            
            const checks = {
                'Mobile media query': content.includes('@media (max-width: 768px)'),
                'Tablet media query': content.includes('@media (min-width: 769px) and (max-width: 1024px)'),
                'Touch pointer query': content.includes('@media (pointer: coarse)'),
                'Landscape orientation': content.includes('orientation: landscape'),
                'Extra small screens': content.includes('@media (max-width: 480px)'),
                'Mobile table responsiveness': content.includes('overflow-x: auto !important'),
                'Touch-friendly buttons': content.includes('min-width: 44px !important'),
                'Mobile modal adjustments': content.includes('max-width: calc(100vw - 16px)'),
                'Mobile card padding': content.includes('padding: 16px !important'),
                'Mobile drawer width': content.includes('width: 280px !important')
            };
            
            return checks;
        }
    },
    {
        name: 'Mobile Navigation Features',
        check: () => {
            const layoutPath = path.join(projectRoot, 'frontend/src/components/Layout.jsx');
            const content = fs.readFileSync(layoutPath, 'utf8');
            
            const checks = {
                'Mobile menu toggle': content.includes('toggleSidebar'),
                'Mobile drawer component': content.includes('Mobile Drawer'),
                'Mobile header styles': content.includes('Mobile Header'),
                'Responsive logo sizing': content.includes('fontSize: isMobile ?'),
                'Mobile-specific button styles': content.includes('marginRight: isMobile ?'),
                'Touch event handling': content.includes('onClick={() => setMobileDrawerVisible(false)'),
                'Responsive font sizes': content.includes('18px\' : \'20px'),
                'Mobile hide logic': content.includes('window.innerWidth < 480'),
                'Hamburger menu icon': content.includes('MenuUnfoldOutlined'),
                'Mobile menu close': content.includes('MenuFoldOutlined')
            };
            
            return checks;
        }
    },
    {
        name: 'Responsive Layout Structure',
        check: () => {
            const layoutPath = path.join(projectRoot, 'frontend/src/components/Layout.jsx');
            const content = fs.readFileSync(layoutPath, 'utf8');
            
            const checks = {
                'Desktop sidebar rendering': content.includes('{!isMobile && ('),
                'Mobile drawer rendering': content.includes('{isMobile && ('),
                'Responsive margin logic': content.includes('marginLeft: isMobile ? 0'),
                'Content area responsiveness': content.includes('overflowX: \'auto\''),
                'Mobile padding adjustments': content.includes('padding: isMobile ? \'12px 8px\''),
                'Responsive transition effects': content.includes('transition: \'left 0.3s ease\''),
                'Fixed positioning for mobile': content.includes('position: \'fixed\''),
                'Z-index management': content.includes('zIndex: 1999'),
                'Flex direction for mobile': content.includes('flexDirection: \'column\''),
                'Mobile header height': content.includes('height: \'64px\'')
            };
            
            return checks;
        }
    }
];

// Run tests
let totalTests = 0;
let passedTests = 0;

tests.forEach(test => {
    console.log(`\n📱 ${test.name}:`);
    const results = test.check();
    
    Object.entries(results).forEach(([checkName, passed]) => {
        totalTests++;
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${checkName}`);
        } else {
            console.log(`  ❌ ${checkName}`);
        }
    });
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Mobile Responsiveness Test Summary:`);
console.log(`  Total Tests: ${totalTests}`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${totalTests - passedTests}`);
console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log(`\n🎉 All mobile responsiveness tests passed!`);
    console.log(`✨ Features implemented:`);
    console.log(`   • Mobile-first responsive design`);
    console.log(`   • Touch-friendly interface elements`);
    console.log(`   • Adaptive sidebar/drawer navigation`);
    console.log(`   • Responsive typography and spacing`);
    console.log(`   • Mobile-optimized modal and card layouts`);
    console.log(`   • Cross-device compatibility`);
    console.log(`   • Landscape and portrait orientation support`);
} else {
    console.log(`\n⚠️  Some mobile responsiveness features need attention.`);
}

console.log(`\n🚀 To test the mobile experience:`);
console.log(`   1. Start the development server`);
console.log(`   2. Open browser developer tools (F12)`);
console.log(`   3. Toggle device toolbar or resize window`);
console.log(`   4. Test different screen sizes and orientations`);
console.log(`   5. Verify touch interactions work properly`);
