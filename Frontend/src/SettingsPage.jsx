import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { User, Check, AlertCircle } from 'lucide-react';
import { auth } from './firebase';

export default function SettingsPage({ theme, setTheme }) {
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL]       = useState(user?.photoURL    || '');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
  }, [user?.uid]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile(user, {
        displayName: displayName.trim() || null,
        photoURL:    photoURL.trim()    || null,
      });
      await user.reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <main className="main-chat">
      <header className="chat-header">
        <div className="header-title">
          <div className="header-title-icon">⚙</div>
          <h1>SETTINGS</h1>
        </div>
      </header>

      <div className="messages-container" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>

        {/* Profile section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <User size={18} />
            <h2>Profile</h2>
          </div>
          <p className="settings-description">
            Your name and avatar are shown in the sidebar and session headers.
          </p>

          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 700, flexShrink: 0,
              overflow: 'hidden',
            }}>
              {photoURL.trim()
                ? <img src={photoURL.trim()} alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                : avatarLetter
              }
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              <div>{displayName || <em>No display name set</em>}</div>
              <div style={{ marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                Display name
              </label>
              <input
                className="auth-input"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                Photo URL <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                className="auth-input"
                type="url"
                placeholder="https://example.com/avatar.png"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                Email <span style={{ opacity: 0.5 }}>(read-only)</span>
              </label>
              <input
                className="auth-input"
                type="email"
                value={user?.email || ''}
                readOnly
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.85rem' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={saving}
                style={{ width: 'auto', padding: '0.45rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {saved ? <><Check size={15} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Appearance section */}
        <div className="settings-section" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Appearance</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Theme</span>
            <button
              className="auth-submit-btn"
              style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
