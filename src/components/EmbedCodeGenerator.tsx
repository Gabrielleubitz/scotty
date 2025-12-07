import React, { useState } from 'react';
import { Copy, Check, Code, Eye, Settings, Tag } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import ChangelogWidget from './ChangelogWidget';
import { AIAgentConfig } from '../types';

// Firebase configuration - matches the main app configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD7tlbe2_A9JCOAcpS7QNRkn9wcoLQ6bE4",
  authDomain: "scotty-acfe5.firebaseapp.com",
  projectId: "scotty-acfe5",
  storageBucket: "scotty-acfe5.firebasestorage.app",
  messagingSenderId: "1048370427467",
  appId: "1:1048370427467:web:90127c22dbebc20eacffce"
};

interface EmbedCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIAgentConfig;
}

export const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ isOpen, onClose, aiConfig }) => {
  const [copied, setCopied] = useState(false);
  const [widgetType, setWidgetType] = useState<'full' | 'notification' | 'gtm'>('full');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [buttonText, setButtonText] = useState("What's New");
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [targetSelector, setTargetSelector] = useState('#my-notification-icon');
  const [badgePosition, setBadgePosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
  const [badgeColor, setBadgeColor] = useState('#ef4444');
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewWidgetOpen, setIsPreviewWidgetOpen] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState('Product Updates');
  const [enableDarkMode, setEnableDarkMode] = useState(true);
  const [showButton, setShowButton] = useState(true);
  const [productId, setProductId] = useState('YOUR_PRODUCT_ID');

  const generateStyleBlock = () => {
    // Return CSS as a properly escaped string for ES5 compatibility
    return '/* Critical YouTube iframe interaction fixes for ProductFlow widget */ ' +
      '.productflow-post::before { content: none !important; display: none !important; pointer-events: none !important; } ' +
      '.productflow-post { position: relative !important; } ' +
      '.productflow-post::before { pointer-events: none !important; } ' +
      'iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"], iframe[src*="youtu.be"] { ' +
      'pointer-events: auto !important; position: relative !important; z-index: 999999 !important; ' +
      'border: none !important; outline: none !important; background: transparent !important; ' +
      'display: block !important; touch-action: auto !important; user-select: auto !important; ' +
      'isolation: auto !important; } ' +
      '#productflow-widget-container, #productflow-widget-container *, ' +
      '.productflow-widget-container, .productflow-widget-container *, ' +
      '[id*="productflow-widget"], [id*="productflow-widget"] *, ' +
      '[class*="productflow-widget"], [class*="productflow-widget"] *, ' +
      '.productflow-posts, .productflow-posts *, .productflow-chat, .productflow-chat *, ' +
      '.productflow-post, .productflow-post *, .productflow-post-content, .productflow-post-content * { ' +
      'pointer-events: auto !important; } ' +
      'div:has(> iframe[src*="youtube"]), p:has(> iframe[src*="youtube"]), span:has(> iframe[src*="youtube"]) { ' +
      'pointer-events: auto !important; z-index: 999998 !important; position: relative !important; ' +
      'isolation: auto !important; } ' +
      '[class*="overflow-"] iframe[src*="youtube"], [class*="scroll-"] iframe[src*="youtube"], ' +
      '[class*="max-h-"] iframe[src*="youtube"], [class*="h-"] iframe[src*="h-"] iframe[src*="youtube"] { ' +
      'pointer-events: auto !important; z-index: 999999 !important; position: relative !important; }';
  };

  const generateFullWidgetCode = () => {
    const baseUrl = 'https://scotty.n2p.io';
    
    return '<!-- ProductFlow Changelog Widget -->\n' +
      '<script>\n' +
      '(function() {\n' +
      '  // Scoped guard so multiple GTM tags don\'t double-load\n' +
      '  window.__productflow_registry = window.__productflow_registry || new Set();\n' +
      '  if (window.__productflow_registry.has(\'' + productId + '\')) return;\n' +
      '  window.__productflow_registry.add(\'' + productId + '\');\n' +
      '\n' +
      '  // Inject critical YouTube interaction styles\n' +
      '  var style = document.createElement(\'style\');\n' +
      '  style.id = \'productflow-youtube-fix\';\n' +
      '  style.textContent = \'' + generateStyleBlock() + '\';\n' +
      '  document.head.appendChild(style);\n' +
      '\n' +
      '  // Widget Configuration\n' +
      '  window.productflow_config = {\n' +
      '    product_id: \'' + productId + '\',\n' +
      '    position: \'' + widgetPosition + '\',\n' +
      '    buttonText: \'' + buttonText.replace(/'/g, "\\'") + '\',\n' +
      '    widgetTitle: \'' + widgetTitle.replace(/'/g, "\\'") + '\',\n' +
      '    primaryColor: \'' + primaryColor + '\',\n' +
      '    darkMode: ' + enableDarkMode + ',\n' +
      '    showButton: ' + showButton + ',\n' +
      '    apiUrl: \'' + baseUrl + '\',\n' +
      '    firebaseConfig: {\n' +
      '      apiKey: \'' + FIREBASE_CONFIG.apiKey + '\',\n' +
      '      authDomain: \'' + FIREBASE_CONFIG.authDomain + '\',\n' +
      '      projectId: \'' + FIREBASE_CONFIG.projectId + '\',\n' +
      '      storageBucket: \'' + FIREBASE_CONFIG.storageBucket + '\',\n' +
      '      messagingSenderId: \'' + FIREBASE_CONFIG.messagingSenderId + '\',\n' +
      '      appId: \'' + FIREBASE_CONFIG.appId + '\'\n' +
      '    },\n' +
      '    aiAgent: {\n' +
      '      enabled: ' + aiConfig.enabled + ',\n' +
      '      apiUrl: \'' + aiConfig.apiUrl + '\',\n' +
      '      trackingUrl: \'' + baseUrl + '\'\n' +
      '    }\n' +
      '  };\n' +
      '\n' +
      '  // Script loader with CSP and error handling\n' +
      '  function loadScript(src) {\n' +
      '    var script = document.createElement(\'script\');\n' +
      '    script.src = src.trim();\n' +
      '    script.defer = true;\n' +
      '\n' +
      '    // Copy GTM\'s nonce (if available) so CSP doesn\'t block it\n' +
      '    var gtmNonce = document.currentScript && document.currentScript.nonce;\n' +
      '    if (gtmNonce) script.nonce = gtmNonce;\n' +
      '\n' +
      '    script.onerror = function() {\n' +
      '      console.warn(\'ProductFlow script failed to load:\', src);\n' +
      '    };\n' +
      '\n' +
      '    document.head.appendChild(script);\n' +
      '  }\n' +
      '\n' +
      '  // Load the widget script\n' +
      '  loadScript(\'' + baseUrl + '/widget.js\');\n' +
      '})();\n' +
      '</script>';
  };

  const generateNotificationWidgetCode = () => {
    const baseUrl = 'https://scotty.n2p.io';
    
    return '<!-- ProductFlow Notification Badge Widget -->\n' +
      '<!-- Step 1: Add this to your existing icon/button -->\n' +
      '<div id="my-notification-icon" style="position: relative; display: inline-block;">\n' +
      '  <!-- Your existing icon/text goes here -->\n' +
      '  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\n' +
      '    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>\n' +
      '  </svg>\n' +
      '  <!-- Badge will be automatically added here -->\n' +
      '</div>\n' +
      '\n' +
      '<!-- Step 2: Add the widget configuration and script -->\n' +
      '<script>\n' +
      '(function() {\n' +
      '  // Scoped guard so multiple GTM tags don\'t double-load\n' +
      '  window.__productflow_registry = window.__productflow_registry || new Set();\n' +
      '  if (window.__productflow_registry.has(\'' + productId + '-notification\')) return;\n' +
      '  window.__productflow_registry.add(\'' + productId + '-notification\');\n' +
      '\n' +
      '  // Inject critical YouTube interaction styles\n' +
      '  var style = document.createElement(\'style\');\n' +
      '  style.id = \'productflow-youtube-fix\';\n' +
      '  style.textContent = \'' + generateStyleBlock() + '\';\n' +
      '  document.head.appendChild(style);\n' +
      '\n' +
      '  // Notification Widget Configuration\n' +
      '  window.productflow_notification_config = {\n' +
      '    product_id: \'' + productId + '\',\n' +
      '    targetSelector: \'' + targetSelector + '\',\n' +
      '    badgePosition: \'' + badgePosition + '\',\n' +
      '    badgeColor: \'' + badgeColor + '\',\n' +
      '    textColor: \'#ffffff\',\n' +
      '    checkInterval: 30000,\n' +
      '    showZero: false,\n' +
      '    maxCount: 99,\n' +
      '    apiUrl: \'' + baseUrl + '\',\n' +
      '    onClick: function(count) {\n' +
      '      // Try to open the full widget if available\n' +
      '      if (window.productflow_openWidget) {\n' +
      '        window.productflow_openWidget();\n' +
      '      } else if (window.ProductFlow && window.ProductFlow.openWidget) {\n' +
      '        window.ProductFlow.openWidget();\n' +
      '      } else {\n' +
      '        // Fallback behavior\n' +
      '        console.log(\'ProductFlow: \' + count + \' new updates available\');\n' +
      '      }\n' +
      '    }\n' +
      '  };\n' +
      '\n' +
      '  // Script loader with CSP and error handling\n' +
      '  function loadScript(src) {\n' +
      '    var script = document.createElement(\'script\');\n' +
      '    script.src = src.trim();\n' +
      '    script.defer = true;\n' +
      '\n' +
      '    // Copy GTM\'s nonce (if available) so CSP doesn\'t block it\n' +
      '    var gtmNonce = document.currentScript && document.currentScript.nonce;\n' +
      '    if (gtmNonce) script.nonce = gtmNonce;\n' +
      '\n' +
      '    script.onerror = function() {\n' +
      '      console.warn(\'ProductFlow script failed to load:\', src);\n' +
      '    };\n' +
      '\n' +
      '    document.head.appendChild(script);\n' +
      '  }\n' +
      '\n' +
      '  // Load the notification widget script\n' +
      '  loadScript(\'' + baseUrl + '/notification-widget.js?v=' + Date.now() + '\');\n' +
      '})();\n' +
      '</script>';
  };

  const generateGTMCode = () => {
    const baseUrl = 'https://scotty.n2p.io';
    
    return '<!-- ProductFlow Changelog Widget for Google Tag Manager -->\n' +
      '<script>\n' +
      '(function() {\n' +
      '  console.log(\'ProductFlow GTM script is running!\');\n' +
      '  // Scoped guard so multiple GTM tags don\'t double-load\n' +
      '  window.__productflow_registry = window.__productflow_registry || new Set();\n' +
      '  var PRODUCT_ID = \'' + productId + '\'; // Define product ID once\n' +
      '  var API_URL = \'' + baseUrl + '\';\n' +
      '\n' +
      '  if (window.__productflow_registry.has(PRODUCT_ID)) return;\n' +
      '  window.__productflow_registry.add(PRODUCT_ID);\n' +
      '\n' +
      '  // Inject critical YouTube interaction styles\n' +
      '  var style = document.createElement(\'style\');\n' +
      '  style.id = \'productflow-youtube-fix\';\n' +
      '  style.textContent = \'' + generateStyleBlock() + '\';\n' +
      '  document.head.appendChild(style);\n' +
      '\n' +
      '  // Widget Configuration\n' +
      '  window.productflow_config = {\n' +
      '    product_id: PRODUCT_ID,\n' +
      '    position: \'' + widgetPosition + '\',\n' +
      '    buttonText: \'' + buttonText.replace(/'/g, "\\'") + '\',\n' +
      '    widgetTitle: \'' + widgetTitle.replace(/'/g, "\\'") + '\',\n' +
      '    primaryColor: \'' + primaryColor + '\',\n' +
      '    darkMode: ' + enableDarkMode + ',\n' +
      '    showButton: ' + showButton + ',\n' +
      '    apiUrl: API_URL,\n' +
      '    firebaseConfig: {\n' +
      '      apiKey: \'' + FIREBASE_CONFIG.apiKey + '\',\n' +
      '      authDomain: \'' + FIREBASE_CONFIG.authDomain + '\',\n' +
      '      projectId: \'' + FIREBASE_CONFIG.projectId + '\',\n' +
      '      storageBucket: \'' + FIREBASE_CONFIG.storageBucket + '\',\n' +
      '      messagingSenderId: \'' + FIREBASE_CONFIG.messagingSenderId + '\',\n' +
      '      appId: \'' + FIREBASE_CONFIG.appId + '\'\n' +
      '    },\n' +
      '    aiAgent: {\n' +
      '      enabled: ' + aiConfig.enabled + ',\n' +
      '      apiUrl: \'' + aiConfig.apiUrl + '\',\n' +
      '      trackingUrl: API_URL\n' +
      '    }\n' +
      '  };\n' +
      '\n' +
      '  // Notification Badge Configuration\n' +
      '  window.productflow_notification_config = {\n' +
      '    product_id: PRODUCT_ID,\n' +
      '    targetSelector: \'' + targetSelector + '\',\n' +
      '    badgePosition: \'' + badgePosition + '\',\n' +
      '    badgeColor: \'' + badgeColor + '\',\n' +
      '    textColor: \'#ffffff\',\n' +
      '    checkInterval: 30000,\n' +
      '    showZero: false,\n' +
      '    maxCount: 99,\n' +
      '    apiUrl: API_URL,\n' +
      '    onClick: function(count) {\n' +
      '      // Open the ProductFlow widget when notification badge is clicked\n' +
      '      if (typeof window.productflow_openWidget === \'function\') {\n' +
      '        window.productflow_openWidget();\n' +
      '      } else if (window.ProductFlow && window.ProductFlow.openWidget) {\n' +
      '        window.ProductFlow.openWidget();\n' +
      '      }\n' +
      '    }\n' +
      '  };\n' +
      '\n' +
      '  // Script loader with CSP and error handling\n' +
      '  function loadScript(src) {\n' +
      '    var script = document.createElement(\'script\');\n' +
      '    script.src = src.trim();\n' +
      '    script.defer = true;\n' +
      '\n' +
      '    // Copy GTM\'s nonce (if available) so CSP doesn\'t block it\n' +
      '    var gtmNonce = document.currentScript && document.currentScript.nonce;\n' +
      '    if (gtmNonce) script.nonce = gtmNonce;\n' +
      '\n' +
      '    script.onerror = function() {\n' +
      '      console.warn(\'ProductFlow script failed to load:\', src);\n' +
      '    };\n' +
      '\n' +
      '    document.head.appendChild(script);\n' +
      '  }\n' +
      '\n' +
      '  // Load the widget scripts\n' +
      '  loadScript(API_URL + \'/widget.js\');\n' +
      '  loadScript(API_URL + \'/notification-widget.js?v=' + Date.now() + '\');\n' +
      '\n' +
      '  // Debug function to check widget loading (optional - can be removed in production)\n' +
      '  window.addEventListener(\'load\', function() {\n' +
      '    setTimeout(function() {\n' +
      '      console.log(\'=== ProductFlow GTM Debug Info ===\');\n' +
      '      console.log(\'ProductFlow widget loaded:\', typeof window.ProductFlow !== \'undefined\');\n' +
      '      console.log(\'Notification widget loaded:\', typeof window.productflow_notification !== \'undefined\');\n' +
      '      console.log(\'Notification config:\', window.productflow_notification_config);\n' +
      '      console.log(\'Main config:\', window.productflow_config);\n' +
      '      \n' +
      '      // Check if notification target exists\n' +
      '      var target = document.querySelector(\'' + targetSelector + '\');\n' +
      '      console.log(\'Notification target found:\', !!target);\n' +
      '      if (target) {\n' +
      '        console.log(\'Target element:\', target);\n' +
      '        \n' +
      '        // Check for existing badge\n' +
      '        var existingBadge = target.querySelector(\'.productflow-notification-badge\');\n' +
      '        console.log(\'Existing badge found:\', !!existingBadge);\n' +
      '      }\n' +
      '    }, 2000);\n' +
      '  });\n' +
      '})();\n' +
      '</script>';
  };

  const generateEmbedCode = () => {
    switch (widgetType) {
      case 'full':
        return generateFullWidgetCode();
      case 'notification':
        return generateNotificationWidgetCode();
      case 'gtm':
        return generateGTMCode();
      default:
        return generateFullWidgetCode();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Embed Widget Code" size="xl">
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">✅ Production Ready</h3>
          <p className="text-sm text-green-800 mb-2">
            This embed code has been optimized based on developer feedback and includes:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>GTM Compatible:</strong> IIFE wrapper and registry to prevent double-loading</li>
            <li>• <strong>CSP Safe:</strong> Automatic nonce handling for Content Security Policy</li>
            <li>• <strong>Error Handling:</strong> Graceful fallbacks if scripts fail to load</li>
            <li>• <strong>Non-blocking:</strong> Deferred loading won't impact page performance</li>
            <li>• <strong>SPA Ready:</strong> Works with single-page applications</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How to use:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Configure your product ID and customize settings below</li>
            <li>2. Copy the generated embed code</li>
            <li>3. Paste it into your website's HTML or Google Tag Manager</li>
            <li>4. The widget will automatically load your latest updates</li>
          </ol>
        </div>

        {/* Widget Configuration */}
        <div className="space-y-6">
          {/* Product ID */}
          <div>
            <Input
              label="Product ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="your-product-name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for your product. Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Widget Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setWidgetType('full')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  widgetType === 'full'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-1">Full Widget</h4>
                <p className="text-sm text-gray-600">Complete changelog widget with chat</p>
              </button>
              <button
                onClick={() => setWidgetType('notification')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  widgetType === 'notification'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-1">Notification Badge</h4>
                <p className="text-sm text-gray-600">Lightweight badge for existing icons</p>
              </button>
              <button
                onClick={() => setWidgetType('gtm')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  widgetType === 'gtm'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-1">Google Tag Manager</h4>
                <p className="text-sm text-gray-600">Complete GTM integration</p>
              </button>
            </div>
          </div>

          {/* Configuration based on widget type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(widgetType === 'full' || widgetType === 'gtm') ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Widget Position
                  </label>
                  <select
                    value={widgetPosition}
                    onChange={(e) => setWidgetPosition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Button Text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="What's New"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="Widget Title"
                    value={widgetTitle}
                    onChange={(e) => setWidgetTitle(e.target.value)}
                    placeholder="Product Updates"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Button
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowButton(true)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        showButton
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="font-medium text-gray-900">Show Button</span>
                      </div>
                      <p className="text-xs text-gray-600">Display floating button</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowButton(false)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        !showButton
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span className="font-medium text-gray-900">Hidden</span>
                      </div>
                      <p className="text-xs text-gray-600">Programmatic control only</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {showButton 
                      ? 'Button will be visible for users to click'
                      : 'Use window.productflow_openWidget() to open programmatically'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Widget Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEnableDarkMode(false)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        !enableDarkMode
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                        <span className="font-medium text-gray-900">Light Mode</span>
                      </div>
                      <p className="text-xs text-gray-600">Clean white background</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnableDarkMode(true)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        enableDarkMode
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></div>
                        <span className="font-medium text-gray-900">Dark Mode</span>
                      </div>
                      <p className="text-xs text-gray-600">Dark background theme</p>
                    </button>
                  </div>
                </div>
              </>
            ) : widgetType === 'notification' ? (
              <>
                <div>
                  <Input
                    label="Target CSS Selector"
                    value={targetSelector}
                    onChange={(e) => setTargetSelector(e.target.value)}
                    placeholder="#my-notification-icon"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CSS selector for the element to attach the badge to
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge Position
                  </label>
                  <select
                    value={badgePosition}
                    onChange={(e) => setBadgePosition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      placeholder="#ef4444"
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            ) : null}
            
            {/* GTM-specific configuration */}
            {widgetType === 'gtm' && (
              <div className="md:col-span-2">
                <Input
                  label="Notification Target Selector"
                  value={targetSelector}
                  onChange={(e) => setTargetSelector(e.target.value)}
                  placeholder="#my-notification-icon"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSS selector for the element to attach the notification badge to
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview:</h4>
            <div className="relative bg-white border rounded-lg h-32 overflow-hidden mb-4">
              <div
                className="absolute flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                style={{
                  backgroundColor: primaryColor,
                  [widgetPosition.includes('bottom') ? 'bottom' : 'top']: '12px',
                  [widgetPosition.includes('right') ? 'right' : 'left']: '12px',
                  display: showButton ? 'flex' : 'none'
                }}
                onClick={() => setIsPreviewWidgetOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                {widgetTitle}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </div>
              {!showButton && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Button hidden - use programmatic control
                </div>
              )}
            </div>
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewWidgetOpen(true)}
              >
                <Eye size={16} className="mr-2" />
                Test Widget Functionality
              </Button>
            </div>
          </div>
        )}

        {/* GTM Instructions */}
        {widgetType === 'gtm' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Google Tag Manager Integration</h3>
                  <p className="text-sm text-blue-800">
                    This code is optimized for Google Tag Manager and includes both the main widget and notification badge functionality.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag size={20} className="mr-2" />
                GTM Setup Instructions
              </h4>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Prerequisites:</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access to your Google Tag Manager account and container</li>
                    <li>The <code className="bg-gray-100 px-1 py-0.5 rounded">{targetSelector}</code> element must exist in your application's HTML</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Step 1: Create a New Custom HTML Tag</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Log in to Google Tag Manager and select your container</li>
                    <li>Navigate to "Tags" in the left-hand navigation</li>
                    <li>Click the "New" button</li>
                    <li>Name your tag (e.g., "ProductFlow - Widget & Notification")</li>
                    <li>Choose "Custom HTML" as the tag type</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Step 2: Paste the Script</h5>
                  <p>Copy the generated script below and paste it into the "HTML" text area of your Custom HTML tag.</p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Step 3: Configure the Trigger</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Click "Triggering" in your tag configuration</li>
                    <li>Select "Initialization - All Pages" trigger for early loading</li>
                    <li>Save the tag</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Step 4: Preview and Publish</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Click "Preview" to test your configuration</li>
                    <li>Verify the tag fires correctly and check for console messages</li>
                    <li>Click "Submit" and then "Publish" to make it live</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">✅ GTM Optimizations Included</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Double-loading prevention:</strong> Registry system prevents conflicts</li>
                <li>• <strong>CSP compatibility:</strong> Automatic nonce handling</li>
                <li>• <strong>Debug logging:</strong> Console messages for troubleshooting</li>
                <li>• <strong>Error handling:</strong> Graceful fallbacks if scripts fail</li>
                <li>• <strong>Combined functionality:</strong> Both widget and notification badge</li>
              </ul>
            </div>
          </div>
        )}

        {/* Generated Code */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Embed Code
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
              <code>{generateEmbedCode()}</code>
            </pre>
          </div>
        </div>

        {/* Developer Notes */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Developer Notes:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {widgetType === 'gtm' ? (
              <>
                <li>• <strong>GTM Optimized:</strong> Designed specifically for Google Tag Manager</li>
                <li>• <strong>Combined Functionality:</strong> Includes both widget and notification badge</li>
                <li>• <strong>Debug Ready:</strong> Console logging helps with troubleshooting</li>
                <li>• <strong>Production Safe:</strong> Registry prevents double-loading in GTM</li>
                <li>• <strong>CSP Compatible:</strong> Handles Content Security Policy automatically</li>
              </>
            ) : (
              <>
            <li>• <strong>GTM Safe:</strong> Uses IIFE and registry to prevent conflicts</li>
            <li>• <strong>CSP Compatible:</strong> Automatically handles nonce attributes</li>
            <li>• <strong>Error Resilient:</strong> Won't break your site if our servers are down</li>
            <li>• <strong>Performance Optimized:</strong> Non-blocking, deferred script loading</li>
            <li>• <strong>SPA Ready:</strong> Works with React, Vue, Angular, and other SPAs</li>
            {!showButton && widgetType === 'full' && (
              <li>• <strong>Programmatic Control:</strong> Use <code>window.productflow_openWidget()</code> to open</li>
            )}
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Live Widget Preview */}
      <ChangelogWidget 
        isOpen={isPreviewWidgetOpen} 
        onClose={() => setIsPreviewWidgetOpen(false)} 
        onMarkAsRead={() => {}}
      />
    </Modal>
  );
};