// Debug script for MathVerse app
// Run this in the browser console to check for common issues

console.log('🔍 MathVerse Debug Script Starting...');

// Check if React is loaded
if (typeof React !== 'undefined') {
  console.log('✅ React is loaded');
} else {
  console.error('❌ React is not loaded');
}

// Check if localStorage is available
try {
  localStorage.setItem('debug_test', 'test');
  localStorage.removeItem('debug_test');
  console.log('✅ localStorage is available');
} catch (error) {
  console.error('❌ localStorage is not available:', error);
}

// Check CSS variables
const root = document.documentElement;
const computedStyle = getComputedStyle(root);

const cssVars = [
  '--background',
  '--foreground', 
  '--primary',
  '--card',
  '--muted'
];

console.log('🎨 Checking CSS Variables:');
cssVars.forEach(varName => {
  const value = computedStyle.getPropertyValue(varName);
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ❌ ${varName}: not found`);
  }
});

// Check for common errors
console.log('🔍 Checking for common issues:');

// Check if any scripts failed to load
const scripts = document.querySelectorAll('script');
let failedScripts = 0;
scripts.forEach(script => {
  if (script.src && !script.complete) {
    console.error(`❌ Script failed to load: ${script.src}`);
    failedScripts++;
  }
});

if (failedScripts === 0) {
  console.log('✅ All scripts loaded successfully');
}

// Check for React errors in console
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
    console.log('🚨 React error detected!');
  }
};

// Check if the app root exists
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('✅ Root element found');
  console.log('  - Children count:', rootElement.children.length);
  console.log('  - Inner HTML length:', rootElement.innerHTML.length);
} else {
  console.error('❌ Root element not found');
}

// Check for any unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

console.log('🔍 Debug script completed. Check the output above for any issues.'); 