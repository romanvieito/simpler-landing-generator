// Create a test site for editing feature testing
const { sql } = require('@vercel/postgres');

async function createTestSite() {
  try {
    // Test HTML for editing
    const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Test Landing Page - Edit Me</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            color: #333;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        .hero p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            background: #ff6b35;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .section {
            padding: 4rem 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        .audience {
            background: #f8f9fa;
        }
        .contact {
            background: white;
        }
        .contact form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-width: 400px;
            margin: 0 auto;
        }
        .contact input, .contact textarea {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 0.25rem;
            font-size: 1rem;
        }
        .contact textarea {
            min-height: 120px;
            resize: vertical;
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Welcome to Test Landing</h1>
        <p>This is a test landing page for editing functionality. Click on any text to start editing!</p>
        <a href="#contact" class="btn">Get Started</a>
    </section>

    <section class="section audience">
        <h2>Who This Is For</h2>
        <p>This landing page is perfect for testing the edit feature. You can click on any text element and modify it directly.</p>
        <div>
            <h3>Easy Editing</h3>
            <p>Simply click on text to make it editable. No complex interfaces needed.</p>
        </div>
        <div>
            <h3>Real-time Changes</h3>
            <p>See your changes instantly as you type. The preview updates immediately.</p>
        </div>
        <div>
            <h3>Save & Publish</h3>
            <p>When you're done editing, save your changes and publish your site.</p>
        </div>
    </section>

    <section class="section contact" id="contact">
        <h2>Get In Touch</h2>
        <p>Ready to get started? Send us a message and we'll help you create the perfect landing page.</p>
        <form action="/api/contact/test-site-id" method="POST">
            <input type="text" name="name" placeholder="Your Name" required>
            <input type="email" name="email" placeholder="your@email.com" required>
            <textarea name="message" placeholder="Tell us about your project..." required></textarea>
            <button type="submit" class="btn">Send Message</button>
        </form>
    </section>
</body>
</html>`;

    const testPlan = {
      title: "Test Landing Page",
      palette: { primary: "#667eea", secondary: "#764ba2", background: "#ffffff", text: "#333333", accent: "#ff6b35" },
      fonts: { heading: "Inter", body: "Inter" },
      sectionsContent: {
        hero: {
          headline: "Welcome to Test Landing",
          subhead: "This is a test landing page for editing functionality. Click on any text to start editing!",
          primaryCta: "Get Started"
        },
        audience: {
          title: "Who This Is For",
          description: "This landing page is perfect for testing the edit feature. You can click on any text element and modify it directly."
        },
        contact: {
          title: "Get In Touch",
          nameLabel: "Your Name",
          emailLabel: "your@email.com",
          messageLabel: "Tell us about your project...",
          submitLabel: "Send Message"
        }
      }
    };

    // Create a test user ID (in a real scenario this would come from Clerk)
    const testUserId = 'dev-user';

    const { rows } = await sql`
      INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url)
      VALUES (gen_random_uuid(), ${testUserId}, 'Test Landing Page', 'A test site for editing functionality', ${JSON.stringify(testPlan)}, ${testHtml}, null)
      RETURNING id
    `;

    console.log('Test site created with ID:', rows[0].id);
    return rows[0].id;

  } catch (error) {
    console.error('Error creating test site:', error);
  }
}

createTestSite().then(() => process.exit(0));