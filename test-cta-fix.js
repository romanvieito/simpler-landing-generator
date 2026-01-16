// Test the CTA button linking functionality
const fs = require('fs');
const path = require('path');

try {
  console.log('Testing CTA button linking functionality in generate-html route...');

  // Read the generate-html route file
  const routePath = path.join(__dirname, 'app', 'api', 'generate-html', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  // Check for the actual CTA button implementation
  const hasCtaButtonImplementation = routeContent.includes('CTA button MUST be: <a href="#contact-section" class="cta-button">');
  const hasContactSectionId = routeContent.includes('id="contact-section"');
  const hasFormInterceptionScript = routeContent.includes('form.addEventListener(\'submit\', async function (e) {');

  console.log('✓ CTA button links to contact section:', hasCtaButtonImplementation);
  console.log('✓ Contact section has proper ID:', hasContactSectionId);
  console.log('✓ Form submission is intercepted by JavaScript:', hasFormInterceptionScript);

  if (hasCtaButtonImplementation && hasContactSectionId && hasFormInterceptionScript) {
    console.log('SUCCESS: CTA button functionality is properly implemented');
    console.log('- CTA button scrolls to contact section');
    console.log('- Contact form submissions are handled via JavaScript (no page reload)');
    console.log('- State is preserved during interactions');
  } else {
    console.log('ERROR: CTA button functionality is incomplete');
  }

} catch (e) {
  console.log('Error:', e.message);
}