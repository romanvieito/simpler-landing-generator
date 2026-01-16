import { useState, useEffect } from 'react';

export function V2Banner() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('v2-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      setHasBeenDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('v2-banner-dismissed', 'true');
  };

  const handleLearnMore = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
      </div>

      <div className="relative container py-4 md:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✨</span>
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide opacity-90">
                New Version
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-1">
              Enhanced Landing Pages with AI-Powered Design
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>5 sections instead of 3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Unique design per business type</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Premium typography & animations</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleLearnMore}
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Learn More
            </button>

            <button
              onClick={handleDismiss}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/20 transition-colors duration-200"
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">V2 Landing Pages - What's New</h2>
                    <p className="text-sm opacity-90">Enhanced AI-powered design system</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Key Improvements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Key Improvements</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">5 Sections Instead of 3</h4>
                      <p className="text-sm text-gray-600">Hero + Features + Audience + How It Works + Contact = More complete, conversion-optimized pages</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white">🎨</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI-Powered Design System</h4>
                      <p className="text-sm text-gray-600">Each business type gets a unique aesthetic with custom colors, fonts, and effects</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Premium Animations & Typography</h4>
                      <p className="text-sm text-gray-600">Smooth scroll-triggered animations, Google Fonts, and micro-interactions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Archetypes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Smart Design Archetypes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">Tech/SaaS</div>
                    <div className="text-gray-600">Sharp geometry, blue-purple palettes, modern fonts</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">Health/Wellness</div>
                    <div className="text-gray-600">Organic shapes, earth tones, elegant serif fonts</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">Professional Services</div>
                    <div className="text-gray-600">Navy/gold accents, classic typography, structured</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">Local/Artisan</div>
                    <div className="text-gray-600">Warm palettes, handcrafted feel, textured elements</div>
                  </div>
                </div>
              </div>

              {/* Before/After */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Impact</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">3</div>
                      <div className="text-sm text-gray-600">Old Sections</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-gray-600">New Sections</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      <strong>67% more content</strong> per landing page with better conversion potential
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">Ready to try the enhanced generator?</h4>
                  <p className="text-sm text-gray-600 mb-4">Generate a landing page below to see the V2 features in action!</p>
                  <button
                    onClick={handleCloseModal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export for debugging/testing
export function V2BannerController() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('v2-banner-dismissed');
    setHasBeenDismissed(dismissed === 'true');
    setIsVisible(dismissed !== 'true');
  }, []);

  const handleShowAgain = () => {
    setIsVisible(true);
    setHasBeenDismissed(false);
    localStorage.removeItem('v2-banner-dismissed');
  };

  const handleHide = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('v2-banner-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="text-sm font-medium text-gray-900 mb-2">V2 Banner Debug</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Visible:</span>
          <span className={isVisible ? 'text-green-600' : 'text-red-600'}>
            {isVisible ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Dismissed:</span>
          <span className={hasBeenDismissed ? 'text-yellow-600' : 'text-green-600'}>
            {hasBeenDismissed ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShowAgain}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Show Banner
          </button>
          <button
            onClick={handleHide}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Hide Banner
          </button>
        </div>
      </div>
    </div>
  );
}