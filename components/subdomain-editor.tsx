'use client';

import { useState } from 'react';
import { analytics } from '@/lib/mixpanel';

interface SubdomainEditorProps {
  currentSubdomain: string | null;
  onSubdomainUpdate: (subdomain: string) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export default function SubdomainEditor({
  currentSubdomain,
  onSubdomainUpdate,
  className = '',
  disabled = false
}: SubdomainEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [subdomainInput, setSubdomainInput] = useState(currentSubdomain || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!subdomainInput.trim()) return;

    setIsUpdating(true);
    try {
      // Clean the subdomain input
      const cleanSubdomain = subdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanSubdomain) {
        alert('Please enter a valid subdomain name (letters, numbers, and hyphens only)');
        return;
      }

      // Check subdomain availability
      const checkResponse = await fetch('/api/sites/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: `${cleanSubdomain}.easyland.site`,
        }),
      });

      if (!checkResponse.ok) {
        const checkError = await checkResponse.json();
        throw new Error(checkError.error || 'Failed to check subdomain availability');
      }

      const checkResult = await checkResponse.json();
      if (!checkResult.available) {
        alert(`The subdomain "${cleanSubdomain}" is already taken. Please choose a different subdomain name.`);
        return;
      }

      await onSubdomainUpdate(cleanSubdomain);
      analytics.featureUsed('subdomain_updated', { subdomain: cleanSubdomain });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update subdomain:', error);
      alert(error?.message || 'Failed to update subdomain. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSubdomainInput(currentSubdomain || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <input
          type="text"
          value={subdomainInput}
          onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          className="input text-sm"
          style={{
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
            width: '140px',
            height: 'auto'
          }}
          placeholder="mysite"
          disabled={isUpdating || disabled}
          maxLength={50}
        />
        <span className="text-sm text-gray-500">.easyland.site</span>
        <button
          onClick={handleSave}
          disabled={!subdomainInput.trim() || isUpdating || disabled}
          className="btn btn-primary text-xs px-2 py-1"
          style={{ height: 'auto' }}
        >
          {isUpdating ? '...' : 'Set'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isUpdating || disabled}
          className="btn btn-ghost text-xs px-2 py-1"
          style={{ height: 'auto' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {currentSubdomain ? (
        <>
          <a
            href={`https://${currentSubdomain}.easyland.site`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {currentSubdomain}.easyland.site
          </a>
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Edit subdomain"
            disabled={disabled}
          >
            ✏️
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-primary text-xs px-3 py-1"
          disabled={disabled}
        >
          Set Custom URL
        </button>
      )}
    </div>
  );
}