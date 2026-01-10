'use client';

import { useState } from 'react';

interface UrlEditorProps {
  siteId: string;
  currentUrl: string | null;
  onUrlUpdate: (newUrl: string) => Promise<void>;
  className?: string;
  readOnly?: boolean;
}

export default function UrlEditor({ siteId, currentUrl, onUrlUpdate, className = '', readOnly = false }: UrlEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(() => {
    if (!currentUrl) return '';
    // Extract subdomain from full domain (remove .easyland.site)
    return currentUrl.replace(/\.easyland\.site$/, '');
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!urlInput.trim()) return;

    setIsUpdating(true);
    try {
      // Only allow subdomain names, always append .easyland.site
      const subdomain = urlInput.trim().replace(/\.easyland\.site$/, ''); // Remove .easyland.site if present
      const fullDomain = `${subdomain}.easyland.site`;

      // Check if subdomain is available
      const checkResponse = await fetch(`/api/sites/check-subdomain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: fullDomain,
          excludeSiteId: siteId
        }),
      });

      if (!checkResponse.ok) {
        const checkError = await checkResponse.json();
        throw new Error(checkError.error || 'Failed to check subdomain availability');
      }

      const checkResult = await checkResponse.json();
      if (!checkResult.available) {
        alert(`The subdomain "${subdomain}" is already taken. Please choose a different subdomain name.`);
        return;
      }

      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customDomain: fullDomain
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set custom domain');
      }

      // Update the local state with the new custom domain
      await onUrlUpdate(fullDomain);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update URL:', error);

      // Check if this is the shared project URL renaming error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('URL renaming is not supported when using a shared Vercel project')) {
        alert('URL renaming is not supported when using a shared Vercel project. To enable URL renaming, remove the VERCEL_PUBLISH_PROJECT environment variable and deploy each site to its own project.');
      } else {
        alert('Failed to update URL. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setUrlInput(() => {
      if (!currentUrl) return '';
      // Extract subdomain from full domain (remove .easyland.site)
      return currentUrl.replace(/\.easyland\.site$/, '');
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="input text-sm"
          style={{
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
            width: '180px',
            height: 'auto'
          }}
          placeholder="mysite"
          disabled={isUpdating}
        />
        <button
          onClick={handleSave}
          disabled={!urlInput.trim() || isUpdating}
          className="btn btn-primary text-xs px-2 py-1"
          style={{ height: 'auto' }}
        >
          {isUpdating ? '...' : 'Set URL'}
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
      {currentUrl && !readOnly && (
        <button
          onClick={() => setIsEditing(true)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Set subdomain"
        >
          ✏️
        </button>
      )}
    </div>
  );
}