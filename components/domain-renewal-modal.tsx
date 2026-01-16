'use client';

interface DomainRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
}

export function DomainRenewalModal({ isOpen, onClose, domainName }: DomainRenewalModalProps) {
  if (!isOpen) return null;

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Domain Renewal Request: ${domainName}`);
    const body = encodeURIComponent(`Hi,

I would like to renew my domain: ${domainName}

Please let me know the renewal process and pricing.

Thank you!`);
    window.open(`mailto:romanvieito@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Domain Renewal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Renew Domain: {domainName}
            </h3>
            <p className="text-gray-600 mb-4">
              Domain renewal is currently handled manually. Please contact our support team to renew your domain.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-900">Contact Support</span>
            </div>
            <button
              onClick={handleEmailClick}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📧 Email: romanvieito@gmail.com
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              We'll respond with renewal pricing and instructions
            </p>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> Domain renewals are processed manually to ensure everything is set up correctly. You'll receive a response within 24 hours.
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  );
}