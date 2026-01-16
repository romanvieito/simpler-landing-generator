import mixpanel from 'mixpanel-browser';

// Type definitions for Mixpanel properties
type MixpanelProperties = Record<string, string | number | boolean | null | undefined>;

// Track initialization state
let isInitialized = false;

// Initialize Mixpanel with token from environment variables
export const initMixpanel = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN && !isInitialized) {
    try {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
        autocapture: true,
        record_sessions_percent: 100,
      });
      isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize Mixpanel:', error);
    }
  }
};

// Check if Mixpanel is ready to use
const isMixpanelReady = () => {
  return typeof window !== 'undefined' && isInitialized && mixpanel && mixpanel.identify;
};

// User identification and profile management
export const identifyUser = (userId: string, userProperties?: MixpanelProperties) => {
  if (!isMixpanelReady()) return;

  try {
    mixpanel.identify(userId);

    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
  } catch (error) {
    console.warn('Failed to identify user in Mixpanel:', error);
  }
};

export const setUserProperties = (properties: MixpanelProperties) => {
  if (!isMixpanelReady()) return;
  try {
    mixpanel.people.set(properties);
  } catch (error) {
    console.warn('Failed to set user properties in Mixpanel:', error);
  }
};

export const setUserPropertyOnce = (properties: MixpanelProperties) => {
  if (!isMixpanelReady()) return;
  try {
    mixpanel.people.set_once(properties);
  } catch (error) {
    console.warn('Failed to set user property once in Mixpanel:', error);
  }
};

// Event tracking functions
export const trackEvent = (eventName: string, properties?: MixpanelProperties) => {
  if (!isMixpanelReady()) return;
  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.warn('Failed to track event in Mixpanel:', error);
  }
};

// Specific event tracking for this application
export const analytics = {
  // User authentication events
  userSignedUp: (userId: string, email: string, source?: string) => {
    identifyUser(userId, { email, signup_date: new Date().toISOString() });
    trackEvent('User Signed Up', { email, source });
  },

  userSignedIn: (userId: string, email: string) => {
    identifyUser(userId, { email, last_login: new Date().toISOString() });
    trackEvent('User Signed In', { email });
  },

  // Landing page generation events
  generationStarted: (description: string, style: string) => {
    trackEvent('Generation Started', { description_length: description.length, style });
  },

  generationCompleted: (siteId: string, planTitle: string, sectionsCount: number) => {
    trackEvent('Generation Completed', {
      site_id: siteId,
      plan_title: planTitle,
      sections_count: sectionsCount
    });
    setUserProperties({ last_generation_date: new Date().toISOString() });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_generations');
      } catch (error) {
        console.warn('Failed to increment total_generations in Mixpanel:', error);
      }
    }
  },

  // Publishing events
  sitePublished: (siteId: string, url: string, hasCustomDomain: boolean) => {
    trackEvent('Site Published', {
      site_id: siteId,
      url,
      has_custom_domain: hasCustomDomain
    });
    setUserProperties({ last_publish_date: new Date().toISOString() });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_sites_published');
      } catch (error) {
        console.warn('Failed to increment total_sites_published in Mixpanel:', error);
      }
    }
  },

  siteSaved: (siteId: string, title: string) => {
    trackEvent('Site Saved', { site_id: siteId, title });
  },

  // Purchase events
  creditsPurchaseStarted: (packageType: string, amount: number, credits: number) => {
    trackEvent('Credits Purchase Started', {
      package_type: packageType,
      amount,
      credits
    });
  },

  creditsPurchased: (amount: number, credits: number, stripeSessionId: string) => {
    trackEvent('Credits Purchased', {
      amount,
      credits,
      stripe_session_id: stripeSessionId
    });
    setUserProperties({ last_credit_purchase: new Date().toISOString() });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_credit_purchases', 1);
        mixpanel.people.increment('total_credits_purchased', credits);
      } catch (error) {
        console.warn('Failed to increment credit purchases in Mixpanel:', error);
      }
    }
  },

  domainPurchased: (domain: string, price: number, siteId?: string) => {
    trackEvent('Domain Purchased', {
      domain,
      price,
      site_id: siteId
    });
    setUserProperties({ last_domain_purchase: new Date().toISOString() });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_domains_purchased', 1);
      } catch (error) {
        console.warn('Failed to increment total_domains_purchased in Mixpanel:', error);
      }
    }
  },

  domainRenewed: (domain: string, price: number) => {
    trackEvent('Domain Renewed', { domain, price });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_domain_renewals', 1);
      } catch (error) {
        console.warn('Failed to increment total_domain_renewals in Mixpanel:', error);
      }
    }
  },

  // Site management events
  siteViewed: (siteId: string, title: string) => {
    trackEvent('Site Viewed', { site_id: siteId, title });
  },

  siteEdited: (siteId: string, title: string) => {
    trackEvent('Site Edited', { site_id: siteId, title });
  },

  siteDeleted: (siteId: string, title: string) => {
    trackEvent('Site Deleted', { site_id: siteId, title });
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_sites_deleted', 1);
      } catch (error) {
        console.warn('Failed to increment total_sites_deleted in Mixpanel:', error);
      }
    }
  },

  // Lead tracking (for conversion measurement)
  leadSubmitted: (siteId: string, siteTitle: string, leadEmail: string) => {
    trackEvent('Lead Submitted', {
      site_id: siteId,
      site_title: siteTitle,
      lead_email: leadEmail
    });
    // Track this as a revenue event if you have lead scoring
    if (isMixpanelReady()) {
      try {
        mixpanel.people.increment('total_leads_received');
      } catch (error) {
        console.warn('Failed to increment total_leads_received in Mixpanel:', error);
      }
    }
  },

  // UI interaction events
  ctaClicked: (ctaText: string, location: string, siteId?: string) => {
    trackEvent('CTA Clicked', {
      cta_text: ctaText,
      location,
      site_id: siteId
    });
  },

  featureUsed: (featureName: string, details?: MixpanelProperties) => {
    trackEvent('Feature Used', { feature_name: featureName, ...details });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string, context?: MixpanelProperties) => {
    trackEvent('Error Occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context
    });
  },
};

export default mixpanel;