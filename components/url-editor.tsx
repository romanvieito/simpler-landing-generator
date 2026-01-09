'use client';

import { useState } from 'react';

interface UrlEditorProps {
  siteId: string;
  currentUrl: string | null;
  onUrlUpdate: (newUrl: string) => Promise<void>;
  className?: string;
}

export default function UrlEditor({ siteId, currentUrl, onUrlUpdate, className = '' }: UrlEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!urlInput.trim()) return;

    setIsUpdating(true);
    try {
      // Extract slug from the full URL input
      const slug = urlInput.trim().split('.')[0];

      // First, fetch the existing site data to get the HTML
      const siteResponse = await fetch(`/api/sites/${siteId}`);
      if (!siteResponse.ok) {
        throw new Error('Failed to fetch site data');
      }
      const siteData = await siteResponse.json();

      if (!siteData.site?.html) {
        throw new Error('Site HTML not found');
      }

      // Call the publish API to update the URL
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: siteId,
          nameHint: slug,
          exactName: true,
          html: siteData.site.html
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update URL');
      }

      const data = await response.json();

      // Update the local state with the new URL
      await onUrlUpdate(data.url);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update URL:', error);
      alert('Failed to update URL. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setUrlInput(currentUrl || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="input text-sm"
          style={{
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
            width: '160px',
            height: 'auto'
          }}
          placeholder="your-site.vercel.app"
          disabled={isUpdating}
        />
        <button
          onClick={handleSave}
          disabled={!urlInput.trim() || isUpdating}
          className="btn btn-primary text-xs px-2 py-1"
          style={{ height: 'auto' }}
        >
          {isUpdating ? '...' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isUpdating}
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
      {currentUrl && (
        <a
          href={`https://${currentUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-blue-600 hover:underline truncate"
        >
          {currentUrl}
        </a>
      )}
      {currentUrl && (
        <button
          onClick={() => setIsEditing(true)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Edit URL"
        >
          ✏️
        </button>
      )}
    </div>
  );
}