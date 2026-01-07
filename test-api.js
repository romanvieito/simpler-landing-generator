const { execSync } = require('child_process');

try {
  const response = execSync('curl -s "http://localhost:3000/api/generate-plan" -X POST -H "Content-Type: application/json" -d \'{"description":"test","style":"Professional"}\'', { encoding: 'utf8' });
  const data = JSON.parse(response);

  console.log('API Response Keys:', Object.keys(data.plan || {}));
  if (data.plan?.sectionsContent) {
    console.log('sectionsContent keys:', Object.keys(data.plan.sectionsContent));
    console.log('Hero section:', !!data.plan.sectionsContent.hero);
    console.log('Audience section:', !!data.plan.sectionsContent.audience);
    console.log('Contact section:', !!data.plan.sectionsContent.contact);
    console.log('SUCCESS: sectionsContent structure is correct');
  } else {
    console.log('ERROR: sectionsContent not found');
    console.log('Available keys:', Object.keys(data.plan || {}));
  }
} catch (e) {
  console.log('Error:', e.message);
}
