import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ─── PWA Install Prompt ───────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install banner after a short delay (only if not already installed)
  setTimeout(() => {
    if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
      showInstallBanner();
    }
  }, 3000);
});

function showInstallBanner() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%);
    color: #f5f0e6;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 92vw;
    width: 380px;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  banner.innerHTML = `
    <div style="font-size: 28px; flex-shrink: 0;">🕌</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">Install Kamgbunli Legacy</div>
      <div style="font-size: 12px; opacity: 0.7;">Add to your home screen for quick access</div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
      <button id="pwa-install-btn" style="
        background: #d4c9a8;
        color: #1a3a2a;
        border: none;
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
      ">Install</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: #d4c9a8;
        border: 1px solid rgba(212,201,168,0.3);
        padding: 4px 16px;
        border-radius: 8px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
      ">Not now</button>
    </div>
  `;

  // Add animation keyframes
  if (!document.getElementById('pwa-install-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-install-style';
    style.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
    }
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    // Don't show again for this session
    sessionStorage.setItem('pwa-dismissed', 'true');
  });
}

// For iOS: show a custom instruction banner (iOS doesn't support beforeinstallprompt)
window.addEventListener('load', () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isDismissed = sessionStorage.getItem('pwa-dismissed');

  if (isIOS && !isStandalone && !isDismissed) {
    setTimeout(() => {
      showIOSInstallBanner();
    }, 4000);
  }
});

function showIOSInstallBanner() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%);
    color: #f5f0e6;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    max-width: 92vw;
    width: 380px;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
  `;

  banner.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 8px;">🕌</div>
    <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">Install Kamgbunli Legacy</div>
    <div style="font-size: 12px; opacity: 0.8; line-height: 1.5; margin-bottom: 10px;">
      Tap <span style="font-size: 16px; vertical-align: middle;">⎙</span> <strong>Share</strong> then <strong>"Add to Home Screen"</strong>
    </div>
    <button id="pwa-dismiss-btn" style="
      background: rgba(212,201,168,0.2);
      color: #d4c9a8;
      border: 1px solid rgba(212,201,168,0.3);
      padding: 6px 20px;
      border-radius: 10px;
      font-size: 12px;
      cursor: pointer;
      touch-action: manipulation;
    ">Got it</button>
  `;

  if (!document.getElementById('pwa-install-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-install-style';
    style.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('pwa-dismissed', 'true');
  });
}

// ─── Service Worker Registration with Update Detection ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 30 seconds
      setInterval(() => {
        registration.update();
      }, 30 * 1000);

      // Detect when a new SW is found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }).catch(() => { });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateBanner();
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      showUpdateBanner();
    }
  });
}

function showUpdateBanner() {
  if (document.getElementById('sw-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: #1a3a2a;
    color: #f5f0e6;
    padding: 14px 22px;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    max-width: 90vw;
    animation: slideUp 0.35s ease-out;
  `;

  banner.innerHTML = `
    <span>🔄 New update available!</span>
    <button id="sw-update-btn" style="
      background: #d4c9a8;
      color: #1a3a2a;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
    ">Update Now</button>
  `;

  if (!document.getElementById('sw-update-style')) {
    const style = document.createElement('style');
    style.id = 'sw-update-style';
    style.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('sw-update-btn').addEventListener('click', () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  });
}
