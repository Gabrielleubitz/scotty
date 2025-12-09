// ProductFlow Widget Script - Modern Glassmorphic Version with Dark Mode
(function() {
  // Get configuration from global variable or use defaults
  const config = window.productflow_config || {
    product_id: 'default',
    position: 'bottom-right',
    buttonText: "What's New",
    widgetTitle: 'Product Updates',
    primaryColor: '#2563eb',
    enableLanguageSelector: true,
    darkMode: false
  };
  
  // Set default dark mode to false if not specified
  if (config.darkMode === undefined) {
    config.darkMode = false;
  }

  // Set API URL based on product_id or use current origin
  config.apiUrl = config.apiUrl || window.location.origin;
  
  // Team ID is required for API calls
  if (!config.teamId) {
    console.error('ProductFlow: teamId is required in config');
  }

  // Dark mode state
  let isDarkMode = config.darkMode || false;

  // Position styles mapping
  const positionStyles = {
    'bottom-right': 'bottom: 24px; right: 24px;',
    'bottom-left': 'bottom: 24px; left: 24px;',
    'top-right': 'top: 24px; right: 24px;',
    'top-left': 'top: 24px; left: 24px;',
    'left-notch': 'left: 0; top: 50%; transform: translateY(-50%); border-radius: 0 12px 12px 0;',
    'right-notch': 'right: 0; top: 50%; transform: translateY(-50%); border-radius: 12px 0 0 12px;'
  };

  // Create dynamic styles with dark mode support
  // Pre-compute dark mode values to avoid nested template literal issues
  const borderColor = isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(15, 23, 42, 0.5)';
  const tabBg = isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(248, 250, 252, 0.8)';
  const tabBorder = isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.1)';
  const tabHover = isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(241, 245, 249, 0.8)';
  const postBg = isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.8)';
  const postBorder = isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.3)';
  const postHover = isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  const chatBg = isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(248, 250, 252, 0.8)';
  const chatBorder = isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.2)';
  const inputBg = isDarkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const inputBorder = isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.4)';
  const focusShadow = isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)';
  const welcomeBg = isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(248, 250, 252, 0.8)';
  const welcomeBorder = isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.3)';
  
  const createStyles = () => `
    :root {
      --pf-primary: ${config.primaryColor};
      --pf-primary-hover: ${config.primaryColor}dd;
      --pf-bg-light: rgba(255, 255, 255, 0.95);
      --pf-bg-dark: rgba(17, 24, 39, 0.95);
      --pf-glass-light: rgba(255, 255, 255, 0.8);
      --pf-glass-dark: rgba(17, 24, 39, 0.8);
      --pf-border-light: rgba(255, 255, 255, 0.2);
      --pf-border-dark: rgba(55, 65, 81, 0.3);
      --pf-text-light: #1e293b;
      --pf-text-dark: #f8fafc;
      --pf-text-muted-light: #64748b;
      --pf-text-muted-dark: #94a3b8;
      --pf-surface-light: rgba(248, 250, 252, 0.8);
      --pf-surface-dark: rgba(31, 41, 55, 0.8);
      --pf-hover-light: rgba(248, 250, 252, 0.9);
      --pf-hover-dark: rgba(31, 41, 55, 0.9);
    }

    .productflow-dark {
      --pf-bg: var(--pf-bg-dark);
      --pf-glass: var(--pf-glass-dark);
      --pf-border: var(--pf-border-dark);
      --pf-text: var(--pf-text-dark);
      --pf-text-muted: var(--pf-text-muted-dark);
      --pf-surface: var(--pf-surface-dark);
      --pf-hover: var(--pf-hover-dark);
    }

    .productflow-light {
      --pf-bg: var(--pf-bg-light);
      --pf-glass: var(--pf-glass-light);
      --pf-border: var(--pf-border-light);
      --pf-text: var(--pf-text-light);
      --pf-text-muted: var(--pf-text-muted-light);
      --pf-surface: var(--pf-surface-light);
      --pf-hover: var(--pf-hover-light);
    }
    
    #productflow-widget-button {
      position: fixed;
      ${positionStyles[config.position] || positionStyles['bottom-right']}
      background: var(--pf-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--pf-border);
      border-radius: ${config.position === 'left-notch' || config.position === 'right-notch' ? '0 12px 12px 0' : '50px'};
      padding: ${config.position === 'left-notch' || config.position === 'right-notch' ? '12px 8px' : '14px 24px'};
      color: var(--pf-text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${config.position === 'left-notch' || config.position === 'right-notch' ? '12px' : '14px'};
      font-weight: 600;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      flex-direction: ${config.position === 'left-notch' || config.position === 'right-notch' ? 'column' : 'row'};
      align-items: center;
      justify-content: center;
      gap: ${config.position === 'left-notch' || config.position === 'right-notch' ? '4px' : '10px'};
      writing-mode: ${config.position === 'left-notch' || config.position === 'right-notch' ? 'vertical-rl' : 'horizontal-tb'};
      text-orientation: ${config.position === 'left-notch' || config.position === 'right-notch' ? 'mixed' : 'mixed'};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      text-decoration: none;
      outline: none;
      min-width: ${config.position === 'left-notch' || config.position === 'right-notch' ? '48px' : 'auto'};
      min-height: ${config.position === 'left-notch' || config.position === 'right-notch' ? '120px' : 'auto'};
    }
    
    ${config.position === 'left-notch' ? `
      #productflow-widget-button {
        border-left: none;
        border-radius: 0 12px 12px 0;
      }
    ` : ''}
    
    ${config.position === 'right-notch' ? `
      #productflow-widget-button {
        border-right: none;
        border-radius: 12px 0 0 12px;
      }
    ` : ''}
    
    #productflow-widget-button:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 6px 20px rgba(0, 0, 0, 0.1);
      background: var(--pf-hover);
    }
    
    #productflow-widget-button:active {
      transform: translateY(0) scale(0.98);
    }
    
    #productflow-widget-button.has-updates::after {
      content: '';
      position: absolute;
      top: -3px;
      right: -3px;
      width: 12px;
      height: 12px;
      background: linear-gradient(135deg, #ff6b6b, #ff5252);
      border-radius: 50%;
      border: 2px solid var(--pf-bg);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    #productflow-widget-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #productflow-widget-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    
    #productflow-widget-container {
      position: fixed;
      ${config.position === 'left-notch' ? 'left: 0;' : 'right: 0;'}
      top: 0;
      width: 480px;
      max-width: 90vw;
      height: 100vh;
      background: var(--pf-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      ${config.position === 'left-notch' ? 
        `border-right: 1px solid ${borderColor}; border-radius: 0 20px 20px 0;` : 
        `border-left: 1px solid ${borderColor}; border-radius: 20px 0 0 20px;`}
      box-shadow: ${config.position === 'left-notch' ? '10px 0 40px rgba(0, 0, 0, 0.12);' : '-10px 0 40px rgba(0, 0, 0, 0.12);'}
      display: flex;
      flex-direction: column;
      transform: ${config.position === 'left-notch' ? 'translateX(-100%)' : 'translateX(100%)'} translateY(20px);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #productflow-widget-container.active {
      transform: translateX(0) translateY(0);
      opacity: 1;
    }
    
    .productflow-header {
      padding: 24px;
      background: var(--pf-primary);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      border-radius: 20px 0 0 0;
    }
    
    .productflow-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .productflow-logo {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .productflow-logo svg {
      width: 24px;
      height: 24px;
    }
    
    .productflow-header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .productflow-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.2;
      color: white;
    }
    
    .productflow-powered-by {
      margin: 0;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.2;
    }
    
    .productflow-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .productflow-dark-mode-toggle {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
    }
    
    .productflow-dark-mode-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .productflow-close {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: white;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    
    .productflow-close:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }
    
    .productflow-close svg {
      width: 18px;
      height: 18px;
    }
    
    .productflow-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .productflow-view-toggle {
      display: flex;
      background: ${tabBg};
      border-bottom: 1px solid ${tabBorder};
      padding: 6px;
      margin: 0 20px;
      border-radius: 12px;
      margin-top: 0;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .productflow-view-button {
      flex: 1;
      padding: 10px 16px;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      color: var(--pf-text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .productflow-view-button.active {
      background: var(--pf-primary);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .productflow-view-button:hover:not(.active) {
      background: ${tabHover};
      color: var(--pf-text);
    }
    
    .productflow-main-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    .productflow-posts, .productflow-chat {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 20px;
      overflow-y: auto;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(10px);
    }
    
    .productflow-posts.active, .productflow-chat.active {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    
    .productflow-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--pf-text-muted);
      font-size: 16px;
      gap: 16px;
    }
    
    .productflow-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--pf-border);
      border-top: 3px solid var(--pf-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .productflow-post {
      background: var(--pf-glass);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--pf-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .productflow-post::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .productflow-post:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border-color: var(--pf-primary);
    }
    
    .productflow-post:hover::before {
      opacity: 1;
    }
    
    .productflow-post:last-child {
      margin-bottom: 0;
    }
    
    .productflow-post-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    
    .productflow-post-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .productflow-post-badge {
      background: linear-gradient(135deg, var(--pf-primary), #8b5cf6);
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .productflow-post-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--pf-text);
      margin: 0 0 12px 0;
      line-height: 1.4;
      position: relative;
      z-index: 1;
    }
    
    .productflow-post-date {
      font-size: 12px;
      color: var(--pf-text-muted);
      font-weight: 500;
    }
    
    .productflow-post-content {
      color: var(--pf-text-muted);
      line-height: 1.6;
      margin: 16px 0;
      position: relative;
      z-index: 1;
    }
    
    .productflow-post-content h1, 
    .productflow-post-content h2, 
    .productflow-post-content h3 {
      color: var(--pf-text);
      margin-top: 20px;
      margin-bottom: 8px;
    }
    
    .productflow-post-content strong {
      color: var(--pf-text);
    }
    
    .productflow-post-content img, 
    .productflow-post-content video {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 16px 0;
      border: 1px solid var(--pf-border);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    
    .productflow-post-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid ${chatBorder};
      font-size: 11px;
      color: var(--pf-text-muted);
    }
    
    .productflow-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
      color: var(--pf-text-muted);
      gap: 16px;
    }
    
    .productflow-empty-icon {
      width: 64px;
      height: 64px;
      opacity: 0.5;
    }
    
    .productflow-empty h3 {
      margin: 0;
      font-size: 18px;
      color: var(--pf-text);
    }
    
    .productflow-empty p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .productflow-chat {
      display: flex;
      flex-direction: column;
      padding: 0;
    }
    
    .productflow-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      padding-bottom: 0;
    }
    
    .productflow-chat-welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
      gap: 16px;
    }
    
    .productflow-chat-welcome-icon {
      width: 64px;
      height: 64px;
      background: ${welcomeBg};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${welcomeBorder};
    }
    
    .productflow-chat-welcome h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--pf-text);
    }
    
    .productflow-chat-welcome p {
      margin: 0;
      font-size: 14px;
      color: var(--pf-text-muted);
      line-height: 1.5;
    }
    
    .productflow-message {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
      animation: messageSlide 0.3s ease-out;
    }
    
    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .productflow-message.user {
      flex-direction: row-reverse;
    }
    
    .productflow-message-content {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .productflow-message.user .productflow-message-content {
      background: var(--pf-primary);
      color: white;
      border-bottom-right-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .productflow-message.bot .productflow-message-content {
      background: var(--pf-glass);
      color: var(--pf-text);
      border: 1px solid var(--pf-border);
      border-bottom-left-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    
    .productflow-typing {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 16px 20px;
      background: var(--pf-glass);
      border: 1px solid var(--pf-border);
      border-radius: 20px;
      border-bottom-left-radius: 6px;
      max-width: 80px;
    }
    
    .productflow-typing-dot {
      width: 8px;
      height: 8px;
      background: var(--pf-text-muted);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }
    
    .productflow-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .productflow-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-12px); }
    }
    
    .productflow-chat-input {
      padding: 20px;
      background: ${chatBg};
      border-top: 1px solid ${chatBorder};
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }
    
    .productflow-chat-input input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid ${inputBorder};
      border-radius: 12px;
      outline: none;
      font-size: 14px;
      background: ${inputBg};
      color: var(--pf-text);
      transition: all 0.2s ease;
    }
    
    .productflow-chat-input input::placeholder {
      color: var(--pf-text-muted);
    }
    
    .productflow-chat-input input:focus {
      border-color: var(--pf-primary);
      box-shadow: 0 0 0 3px ${focusShadow};
    }
    
    .productflow-chat-input button {
      padding: 12px 20px;
      background: var(--pf-primary);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .productflow-chat-input button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    
    .productflow-chat-input button:active {
      transform: translateY(0);
    }
    
    .productflow-chat-input button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Scrollbar styling */
    .productflow-posts::-webkit-scrollbar,
    .productflow-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .productflow-posts::-webkit-scrollbar-track,
    .productflow-chat-messages::-webkit-scrollbar-track {
      background: var(--pf-surface);
    }
    
    .productflow-posts::-webkit-scrollbar-thumb,
    .productflow-chat-messages::-webkit-scrollbar-thumb {
      background: var(--pf-border);
      border-radius: 3px;
    }
    
    .productflow-posts::-webkit-scrollbar-thumb:hover,
    .productflow-chat-messages::-webkit-scrollbar-thumb:hover {
      background: var(--pf-text-muted);
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      #productflow-widget-container {
        width: 100%;
        max-width: 100%;
      }
      
      .productflow-header {
        padding: 20px 24px;
      }
      
      .productflow-header h2 {
        font-size: 18px;
      }
      
      .productflow-posts,
      .productflow-chat-messages {
        padding: 20px;
      }
      
      .productflow-post {
        padding: 20px;
      }
      
      .productflow-chat-input {
        padding: 20px;
      }
      
      .productflow-view-toggle {
        margin: 16px 20px 0;
      }
    }
  `;

  // Add styles to page with theme class
  const styleSheet = document.createElement('style');
  styleSheet.textContent = createStyles();
  document.head.appendChild(styleSheet);

  // Apply theme class to body
  const updateTheme = () => {
    document.body.classList.remove('productflow-light', 'productflow-dark');
    document.body.classList.add(isDarkMode ? 'productflow-dark' : 'productflow-light');
  };

  updateTheme();
  
  // Create widget button (only if showButton is not false)
  const showButton = config.showButton !== false; // Default to true if not specified
  console.log('ProductFlow: showButton config =', config.showButton, 'will show button:', showButton);
  let button = null;
  
  if (showButton) {
    button = document.createElement('button');
  button.id = 'productflow-widget-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
    ${config.buttonText}
  `;
    console.log('ProductFlow: Button created with text:', config.buttonText);
  } else {
    console.log('ProductFlow: Button creation skipped (showButton is false)');
  }
  
  // Create overlay and container
  const overlay = document.createElement('div');
  overlay.id = 'productflow-widget-overlay';
  
  const container = document.createElement('div');
  container.id = 'productflow-widget-container';
  container.innerHTML = `
    <div class="productflow-header">
      <div class="productflow-header-left">
        <div class="productflow-logo">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22D3EE" stop-opacity="1" />
                <stop offset="100%" stop-color="#9333EA" stop-opacity="1" />
              </linearGradient>
            </defs>
            <path d="M50 10 L85 25 L85 75 L50 90 L15 75 L15 25 Z" stroke="url(#logoGradient)" stroke-width="4" fill="none" />
            <circle cx="35" cy="35" r="4" fill="url(#logoGradient)" opacity="0.8" />
            <circle cx="50" cy="30" r="3" fill="url(#logoGradient)" opacity="0.7" />
            <circle cx="65" cy="35" r="4" fill="url(#logoGradient)" opacity="0.8" />
            <circle cx="40" cy="50" r="3" fill="url(#logoGradient)" opacity="0.6" />
            <circle cx="60" cy="50" r="3" fill="url(#logoGradient)" opacity="0.6" />
            <circle cx="50" cy="60" r="4" fill="url(#logoGradient)" opacity="0.8" />
            <circle cx="35" cy="65" r="3" fill="url(#logoGradient)" opacity="0.7" />
            <circle cx="65" cy="65" r="3" fill="url(#logoGradient)" opacity="0.7" />
          </svg>
        </div>
        <div class="productflow-header-text">
        <h2>${config.widgetTitle || 'Product Updates'}</h2>
          <p class="productflow-powered-by">Powered by Scotty</p>
        </div>
      </div>
      <div class="productflow-header-right">
        <button class="productflow-close" aria-label="Close widget">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="productflow-view-toggle">
      <button class="productflow-view-button active" data-view="updates">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Updates
      </button>
      <button class="productflow-view-button" data-view="chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Ask AI
      </button>
    </div>
    
    <div class="productflow-content">
      <div class="productflow-main-content">
        <div class="productflow-posts active" id="productflow-posts">
          <div class="productflow-loading">
            <div class="productflow-spinner"></div>
            <span>Loading updates...</span>
          </div>
        </div>
        
        <div class="productflow-chat" id="productflow-chat">
          <div class="productflow-chat-messages" id="productflow-messages">
            <div class="productflow-chat-welcome">
              <div class="productflow-chat-welcome-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>Ask me anything!</h3>
              <p>I can help you understand our latest updates and features.</p>
            </div>
          </div>
          <div class="productflow-chat-input">
            <input type="text" placeholder="Ask about our updates..." id="productflow-chat-input">
            <button id="productflow-chat-send" aria-label="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add elements to page
  if (button) {
  document.body.appendChild(button);
    console.log('ProductFlow: Button appended to DOM');
    // Verify button is visible
    setTimeout(() => {
      const btn = document.getElementById('productflow-widget-button');
      if (btn) {
        const styles = window.getComputedStyle(btn);
        console.log('ProductFlow: Button visibility check:', {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position
        });
      } else {
        console.warn('ProductFlow: Button not found in DOM after append');
      }
    }, 100);
  } else {
    console.log('ProductFlow: No button to append (showButton is false)');
  }
  document.body.appendChild(overlay);
  document.body.appendChild(container);
  console.log('ProductFlow: Widget container and overlay appended to DOM');
  
  // Widget state
  let isOpen = false;
  let activeView = 'updates';
  let posts = [];
  let chatMessages = [];
  let sessionId = null;
  let isTyping = false;
  let db = null;
  let widgetOpenTime = null;
  
  // Event listeners
  if (button) {
  button.addEventListener('click', openWidget);
  }
  // overlay.addEventListener('click', closeWidget); // Removed to allow page interaction
  container.querySelector('.productflow-close').addEventListener('click', closeWidget);
  
  
  // View switching
  container.querySelectorAll('.productflow-view-button').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });
  
  // Chat functionality
  const chatInput = container.querySelector('#productflow-chat-input');
  const chatSend = container.querySelector('#productflow-chat-send');
  
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Prevent container clicks from closing widget
  container.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeWidget();
    }
  });
  
  // Functions
  function openWidget() {
    if (isOpen) return;
    
    isOpen = true;
    widgetOpenTime = Date.now();
    
    // Add classes to trigger animations with slight delay for smoother entry
    overlay.classList.add('active');
    setTimeout(() => {
    container.classList.add('active');
    }, 50);
    
    // Remove notification indicator
    if (button) {
    button.classList.remove('has-updates');
    }
    
    // Load posts when widget opens
    if (posts.length === 0) {
      loadPosts();
    }
    
    // Track widget open if tracking is available
    if (window.productflowTracking) {
      window.productflowTracking.trackWidgetOpen();
    }
  }
  
  function closeWidget() {
    if (!isOpen) return;
    
    isOpen = false;
    
    // Remove classes to trigger animations
    overlay.classList.remove('active');
    container.classList.remove('active');
    
    // Track widget close if tracking is available
    if (window.productflowTracking && widgetOpenTime) {
      const timeSpent = Date.now() - widgetOpenTime;
      window.productflowTracking.trackWidgetClose(timeSpent);
      widgetOpenTime = null;
    }
  }
  
  
  function switchView(view) {
    activeView = view;
    
    // Update view buttons
    container.querySelectorAll('.productflow-view-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update content
    container.querySelectorAll('.productflow-posts, .productflow-chat').forEach(content => {
      content.classList.remove('active');
    });
    
    if (view === 'updates') {
      container.querySelector('.productflow-posts').classList.add('active');
    } else {
      container.querySelector('.productflow-chat').classList.add('active');
    }
  }
  
  // Load Firebase and initialize
  function loadFirebase() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/firebase@8.10.1/firebase-app.js';
  script.onload = function () {
    const firestoreScript = document.createElement('script');
    firestoreScript.src = 'https://cdn.jsdelivr.net/npm/firebase@8.10.1/firebase-firestore.js';
    firestoreScript.onload = function () {
      initializeFirebase();
    };
    document.head.appendChild(firestoreScript);
  };
  document.head.appendChild(script);
}
  
  function initializeFirebase() {
    // Firebase is now optional - only used for tracking and language settings
    // Main data fetching uses secure API endpoints
    // For now, we'll skip Firebase initialization if config doesn't have it
    // Tracking will gracefully degrade if Firebase is not available
    if (!config.firebaseConfig) {
      console.log('ProductFlow: Firebase config not provided. Using API-only mode.');
      db = null;
      return;
    }
    
    try {
      // Initialize Firebase
      firebase.initializeApp(config.firebaseConfig);
      db = firebase.firestore();
    } catch (error) {
      console.warn('ProductFlow: Firebase initialization failed, using API-only mode:', error);
      db = null;
    }
    
    // Initialize tracking
    const trackingService = {
      userId: null,
      sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      domain: window.location.hostname,
      startTime: Date.now(),
      
      init: function() {
        this.userId = this.getOrCreateUserId();
        this.trackVisitor();
        
        window.addEventListener('beforeunload', () => {
          this.updateLastSeen();
        });
      },
      
      getOrCreateUserId: function() {
        let userId = localStorage.getItem('productflow_user_id');
        if (!userId) {
          userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('productflow_user_id', userId);
        }
        return userId;
      },
      
      getBrowserInfo: function() {
        const userAgent = navigator.userAgent;
        
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';

        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'Mac OS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';

        return { browser, os };
      },
      
      trackVisitor: async function() {
        const { browser, os } = this.getBrowserInfo();
        const now = new Date().toISOString();
        
        const firstSeen = localStorage.getItem('productflow_first_seen') || now;
        if (!localStorage.getItem('productflow_first_seen')) {
          localStorage.setItem('productflow_first_seen', now);
        }

        const visitorData = {
          userId: this.userId,
          language: navigator.language || 'EN',
          firstSeen,
          lastSeen: now,
          browser,
          os,
          domain: this.domain,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          sessionId: this.sessionId,
          productId: config.product_id,
          teamId: config.teamId || null // CRITICAL: Include teamId for privacy isolation
        };

        try {
          await db.collection('visitors').add(visitorData);
        } catch (error) {
          console.warn('Could not track visitor:', error);
        }
      },
      
      trackPostView: async function(postId, timeSpent) {
        const postView = {
          postId,
          userId: this.userId,
          domain: this.domain,
          timestamp: new Date().toISOString(),
          timeSpent: timeSpent || 0,
          sessionId: this.sessionId,
          productId: config.product_id,
          teamId: config.teamId || null // CRITICAL: Include teamId for privacy isolation
        };

        try {
          await db.collection('post_views').add(postView);
        } catch (error) {
          console.warn('Could not track post view:', error);
        }
      },
      
      trackWidgetOpen: async function() {
        try {
          await db.collection('widget_events').add({
            eventType: 'widget_open',
            userId: this.userId,
            domain: this.domain,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            productId: config.product_id,
            teamId: config.teamId || null // CRITICAL: Include teamId for privacy isolation
          });
        } catch (error) {
          console.warn('Could not track widget open:', error);
        }
      },
      
      trackWidgetClose: async function(timeSpent) {
        try {
          await db.collection('widget_events').add({
            eventType: 'widget_close',
            userId: this.userId,
            domain: this.domain,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            timeSpent,
            productId: config.product_id,
            teamId: config.teamId || null // CRITICAL: Include teamId for privacy isolation
          });
        } catch (error) {
          console.warn('Could not track widget close:', error);
        }
      },
      
      updateLastSeen: async function() {
        try {
          await db.collection('visitors').add({
            userId: this.userId,
            lastSeen: new Date().toISOString(),
            sessionDuration: Date.now() - this.startTime,
            eventType: 'session_end',
            productId: config.product_id,
            teamId: config.teamId || null // CRITICAL: Include teamId for privacy isolation
          });
        } catch (error) {
          console.warn('Could not update last seen:', error);
        }
      },
      
      trackChatMessage: async function(message, isUser) {
        try {
          await db.collection('widget_events').add({
            eventType: 'chat_message',
            userId: this.userId,
            domain: this.domain,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            message: message.substring(0, 100), // Truncate for privacy
            isUser: isUser,
            productId: config.product_id
          });
        } catch (error) {
          console.warn('Could not track chat message:', error);
        }
      }
    };
    
    // Make tracking service available globally
    window.productflowTracking = trackingService;
    
    // Initialize tracking
    trackingService.init();
    
    console.log('Widget initialized for domain:', window.location.hostname);
  }
  
  async function loadPosts() {
    try {
      const postsContainer = document.getElementById('productflow-posts');
      
      // Get teamId from config
      const teamId = config.teamId;
      if (!teamId) {
        console.error('Team ID not configured in widget');
        postsContainer.innerHTML = `
          <div class="productflow-empty">
            <h3>Configuration Error</h3>
            <p>Widget is not properly configured. Please regenerate the embed code.</p>
          </div>
        `;
      return;
    }
    
      // Get posts from API endpoint (secure, no Firebase keys exposed)
      const currentDomain = window.location.hostname;
      const response = await fetch(`${config.apiUrl}/api/widget/posts?teamId=${encodeURIComponent(teamId)}&domain=${encodeURIComponent(currentDomain)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.posts) {
        throw new Error('Invalid API response');
      }
      
      // Convert ISO date strings back to Date objects
      const posts = data.posts.map(post => ({
        ...post,
        createdAt: new Date(post.createdAt)
      }));
      
      // Load language settings and localize posts (still using Firebase for this, but it's less sensitive)
      let languageSettings = { defaultLanguage: 'en', enabledLanguages: ['en'] };
      if (db) {
        try {
          languageSettings = await loadLanguageSettings();
        } catch (error) {
          console.warn('Could not load language settings, using defaults:', error);
        }
      }
      const localizedPosts = localizePosts(posts, languageSettings);
      
      console.log('📝 Final posts to display:', localizedPosts.length);
      if (localizedPosts.length > 0) {
        console.log('📄 Sample post:', {
          id: localizedPosts[0].id,
          title: localizedPosts[0].title,
          hasContent: !!localizedPosts[0].content,
          contentLength: localizedPosts[0].content?.length || 0,
          hasVideo: !!localizedPosts[0].videoUrl,
          hasImage: !!localizedPosts[0].imageUrl,
          status: localizedPosts[0].status,
          teamId: localizedPosts[0].teamId
        });
      }
      
      displayPosts(localizedPosts);
      
      // Show notification if there are new posts
      if (localizedPosts.length > 0 && button) {
        button.classList.add('has-updates');
      }
      
    } catch (error) {
      console.error('Error loading posts:', error);
      document.getElementById('productflow-posts').innerHTML = `
        <div class="productflow-empty">
          <svg class="productflow-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h3>Unable to load updates</h3>
          <p>Please try again later or contact support if the issue persists.</p>
        </div>
      `;
    }
  }
  
  // Helper function to get segments from Firestore
  async function getSegments() {
    try {
      console.log('📋 Fetching segments from Firestore...');
      
      // Add retry logic for segment fetching
      const segments = await retryOperation(async () => {
        const segmentsRef = db.collection('segments');
        const querySnapshot = await segmentsRef.orderBy('name', 'asc').get();
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            domain: data.domain || '',
            description: data.description || '',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
          };
        }).filter(segment => segment.name && segment.domain); // Filter out invalid segments
      });
      
      console.log('✅ Loaded segments:', segments ? segments.length : 0);
      return segments;
    } catch (error) {
      console.error('❌ Error fetching segments:', error);
      return [];
    }
  }
  
  // Helper function to filter posts by domain
  async function filterPostsByDomain(posts, currentDomain) {
    try {
      if (!posts || posts.length === 0) {
        return [];
      }

      console.log('🔍 Filtering posts for domain:', currentDomain);
      console.log('📊 Total posts before filtering:', posts.length);
      
      // Get all segments
      const segments = await getSegments();
      
      if (!segments || segments.length === 0) {
        console.log('📝 No segments configured, showing all posts');
        return posts;
      }

      // Find segment for current domain
      const currentSegment = segments.find(segment => 
        segment && segment.domain && (
          segment.domain === currentDomain || 
          segment.domain === `www.${currentDomain}` ||
          `www.${segment.domain}` === currentDomain
        )
      );
      
      console.log('🎯 Current segment for domain:', currentSegment);
      
      let filteredPosts;
      
      // If no segment found for this domain, show all posts without segments
      if (!currentSegment) {
        console.log('📝 No segment found for domain, showing posts without segments');
        filteredPosts = posts.filter(post => !post.segmentId || post.segmentId === null || post.segmentId === undefined);
      } else {
        console.log('📝 Segment found, showing posts for segment + posts without segments');
        // Show posts for this segment + posts without segments
        filteredPosts = posts.filter(post => 
          !post.segmentId || 
          post.segmentId === null || 
          post.segmentId === undefined || 
          post.segmentId === currentSegment.id
        );
      }
      
      console.log('✅ Posts after domain filtering:', filteredPosts.length);
      
      return filteredPosts;
    } catch (error) {
      console.error('❌ Error filtering posts by domain:', error);
      // On error, return all posts to prevent breaking the widget
      return posts;
    }
  }
  
  // Retry utility function for widget operations
  async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        console.warn(`Widget operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        // Check if error is retryable
        const isRetryable = error.code === 'resource-exhausted' || 
                           error.code === 'unavailable' || 
                           error.code === 'deadline-exceeded' ||
                           error.code === 'internal' ||
                           (error.message && (
                             error.message.includes('network') ||
                             error.message.includes('timeout') ||
                             error.message.includes('rate limit')
                           ));
        
        // Don't retry on the last attempt or non-retryable errors
        if (attempt === maxRetries || !isRetryable) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  // Batched view increment utility
  const viewIncrementBatch = {
    pending: new Map(),
    timeout: null,
    
    queue: function(postId, increment = 1) {
      const current = this.pending.get(postId) || 0;
      this.pending.set(postId, current + increment);
      
      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // Process batch after delay or when it gets large
      if (this.pending.size >= 10) {
        this.process();
      } else {
        this.timeout = setTimeout(() => this.process(), 2000);
      }
    },
    
    process: async function() {
      if (this.pending.size === 0) return;
      
      const batch = new Map(this.pending);
      this.pending.clear();
      
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      
      console.log(`Processing batched view increments for ${batch.size} posts`);
      
      // Process in chunks to avoid overwhelming Firestore
      const entries = Array.from(batch.entries());
      const chunkSize = 5;
      
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        
        await Promise.allSettled(
          chunk.map(async ([postId, increment]) => {
            try {
              await retryOperation(async () => {
                await incrementPostViewCount(postId, increment);
              });
            } catch (error) {
              console.error(`Failed to increment views for post ${postId}:`, error);
            }
          })
        );
        
        // Small delay between chunks
        if (i + chunkSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  };
  
  // Function to increment post view count via API (secure, no Firebase keys exposed)
  async function incrementPostViewCount(postId, incrementBy = 1) {
    if (!postId) {
      console.warn('Cannot increment view count: missing postId');
      return;
    }
    
    try {
      console.log('🔄 Incrementing view count for post:', postId, 'by', incrementBy);
      
      const response = await fetch(`${config.apiUrl}/api/widget/increment-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: postId,
          incrementBy: incrementBy
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to increment views');
      }
      
      console.log('✅ Successfully incremented views for post:', postId, 'by', incrementBy);
      
    } catch (error) {
      console.error('❌ Failed to increment view count for post:', postId, error);
      throw error; // Re-throw for retry logic
    }
  }
  
  // Localize posts based on user language
  function localizePosts(posts, languageSettings) {
    const userLanguage = getUserLanguage();
    
    return posts.map(post => {
      // If user language is default or not enabled, return original
      if (userLanguage === languageSettings.defaultLanguage || 
          !languageSettings.enabledLanguages.includes(userLanguage)) {
        return post;
      }
      
      // Check if translation exists
      const translation = post.translations?.[userLanguage];
      if (translation && translation.title && translation.content) {
        return {
          ...post,
          title: translation.title,
          content: translation.content
        };
      }
      
      return post;
    });
  }
  
  function displayPosts(posts) {
    const postsContainer = document.getElementById('productflow-posts');
    
    if (posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="productflow-empty">
          <svg class="productflow-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h3>No updates yet</h3>
          <p>Check back soon for the latest product updates!</p>
        </div>
      `;
      return;
    }
    
    // Helper function to get category class
    function getCategoryClass(category) {
      const cat = (category || 'NOTIFICATION').toLowerCase();
      if (cat.includes('feature') || cat.includes('new')) return 'new';
      if (cat.includes('improvement') || cat.includes('improve')) return 'improvement';
      if (cat.includes('fix') || cat.includes('bug')) return 'fix';
      return 'new';
    }
    
    // Helper function to get category label
    function getCategoryLabel(category) {
      const cat = (category || 'NOTIFICATION').toLowerCase();
      if (cat.includes('feature') || cat.includes('new')) return 'New';
      if (cat.includes('improvement') || cat.includes('improve')) return 'Improvement';
      if (cat.includes('fix') || cat.includes('bug')) return 'Fix';
      return 'Update';
    }
    
    postsContainer.innerHTML = posts.map((post, index) => `
      <div class="productflow-post" data-post-id="${post.id}" style="animation: fadeInUp 0.4s ease-out ${index * 0.05}s both;">
        <div class="productflow-post-header">
          <div class="productflow-post-meta">
            <span class="productflow-post-badge ${getCategoryClass(post.category)}">
              ${getCategoryLabel(post.category)}
            </span>
          </div>
            <span class="productflow-post-date">${formatRelativeTime(post.createdAt)}</span>
        </div>
        <h3 class="productflow-post-title">${post.title}</h3>
        ${post.content && post.content.trim() ? `<div class="productflow-post-content">${renderMarkdown(post.content)}</div>` : ''}
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Update image" style="max-width: 100%; border-radius: 12px; margin: 12px 0;" />` : ''}
        ${post.videoUrl ? (
          post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') 
            ? `<div class="productflow-video-container" style="margin: 12px 0;">
                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${post.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="border-radius: 12px; pointer-events: auto; position: relative; z-index: 10;"></iframe>
              </div>`
            : `<video controls width="100%" style="border-radius: 12px; margin: 12px 0;"><source src="${post.videoUrl}" type="video/mp4"></video>`
        ) : ''}
      </div>
    `).join('');
    
    // Add fadeInUp animation if not already added
    if (!document.getElementById('productflow-fade-animation')) {
      const style = document.createElement('style');
      style.id = 'productflow-fade-animation';
      style.textContent = '@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }';
      document.head.appendChild(style);
    }
    
    // Track post views when they come into view
    const postElements = postsContainer.querySelectorAll('.productflow-post');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const postId = entry.target.getAttribute('data-post-id');
          if (postId && window.productflowTracking) {
            // Track view with batching to avoid rate limits
            setTimeout(() => {
              window.productflowTracking.trackPostView(postId);
              // Queue for batched increment to avoid rate limits
              viewIncrementBatch.queue(postId, 1);
            }, 500);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.5 });
    
    postElements.forEach(el => observer.observe(el));
  }
  
  // Load language settings
  async function loadLanguageSettings() {
    try {
      return await retryOperation(async () => {
        const snapshot = await db.collection('language_settings').doc('default').get();
        if (snapshot.exists) {
          return snapshot.data();
        }
        
        // Default settings
        return {
          supportedLanguages: ['en'],
          defaultLanguage: 'en',
          enabledLanguages: ['en']
        };
      });
    } catch (error) {
      console.warn('Could not load language settings:', error);
      
      // Default settings on error
      return {
        supportedLanguages: ['en'],
        defaultLanguage: 'en',
        enabledLanguages: ['en']
      };
    }
  }
  
  // Get user's preferred language
  function getUserLanguage() {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('productflow_user_language');
    if (savedLanguage) return savedLanguage;
    
    // Get browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    return browserLang.split('-')[0].toLowerCase();
  }
  
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || isTyping) return;
    
    addMessage(message, true);
    
    // Track user message
    if (window.productflowTracking && window.productflowTracking.trackChatMessage) {
      window.productflowTracking.trackChatMessage(message, true);
    }
    
    chatInput.value = '';
    chatSend.disabled = true;
    
    showTyping();
    
    try {
      // Check if AI agent is configured
      const aiConfig = config.aiAgent || { enabled: false };
      
      if (aiConfig.enabled && aiConfig.apiUrl) {
        // Get recent posts for context (same posts shown in widget)
        let recentUpdates = [];
        try {
          if (db && config.teamId) {
            const postsSnapshot = await db.collection('changelog')
              .where('teamId', '==', config.teamId)
              .where('status', '==', 'published')
              .orderBy('createdAt', 'desc')
              .limit(5)
              .get();
            
            recentUpdates = postsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                title: data.title || '',
                content: (data.content || '').substring(0, 200),
                date: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
              };
            });
          }
        } catch (error) {
          console.warn('Failed to load recent updates for AI context:', error);
        }
        
        // Use AI agent via proxy (no token needed - handled server-side)
        const response = await fetch(`${config.apiUrl}/api/ai-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-URL': aiConfig.apiUrl,
          },
          body: JSON.stringify({
            message,
            session_id: sessionId,
            stream: false,
            stored_values: {
              recent_updates: recentUpdates,
              domain: window.location.hostname,
              timestamp: new Date().toISOString()
            }
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.message || 'I apologize, but I encountered an issue processing your request.';
          hideTyping();
          addMessage(aiResponse, false);
          
          // Track AI response
          if (window.productflowTracking && window.productflowTracking.trackChatMessage) {
            window.productflowTracking.trackChatMessage(aiResponse, false);
          }
          
          if (data.session_id) {
            sessionId = data.session_id;
          }
        } else {
          throw new Error('AI agent request failed');
        }
      } else {
        throw new Error('AI agent is not configured');
      }
      
    } catch (error) {
      hideTyping();
      const errorMessage = error instanceof Error && error.message === 'AI agent is not configured'
        ? "I'm sorry, the AI chat feature is not configured. Please contact the administrator to enable AI chat support."
        : "I'm sorry, I'm having trouble responding right now. Please check the AI Agent settings or try again later.";
      addMessage(errorMessage, false);
      
      // Track error message as AI response
      if (window.productflowTracking && window.productflowTracking.trackChatMessage) {
        window.productflowTracking.trackChatMessage(errorMessage, false);
      }
    } finally {
      chatSend.disabled = false;
    }
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    viewIncrementBatch.process();
  });
  
  function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('productflow-messages');
    
    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.productflow-chat-welcome');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `productflow-message ${isUser ? 'user' : 'bot'}`;
    
    if (isUser) {
      messageDiv.innerHTML = `<div class="productflow-message-content">${content}</div>`;
    } else {
      // Format AI responses with markdown
      const formattedContent = formatMarkdown(content);
      messageDiv.innerHTML = `<div class="productflow-message-content">${formattedContent}</div>`;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  function showTyping() {
    isTyping = true;
    const messagesContainer = document.getElementById('productflow-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'productflow-message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="productflow-typing">
        <div class="productflow-typing-dot"></div>
        <div class="productflow-typing-dot"></div>
        <div class="productflow-typing-dot"></div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  function hideTyping() {
    isTyping = false;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  // Utility functions
  function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  }

  function getYouTubeEmbedUrl(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      const videoId = match[1];
      const origin = encodeURIComponent(window.location.origin);
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}`;
    }
    return url;
  }
  
  function renderMarkdown(content) {
    if (!content || typeof content !== 'string') return '';
    
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\[youtube\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+))[^)]*\)/g, function(match, fullUrl, videoId) {
        var embedUrl = getYouTubeEmbedUrl(fullUrl);
        return '<div class="my-4 relative" style="pointer-events: auto;"><iframe width="100%" height="250" src="' + embedUrl + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="rounded-lg border border-gray-200" title="YouTube video player" style="pointer-events: auto; position: relative; z-index: 10;"></iframe></div>';
      })
      .replace(/\[video\]\(([^)]+)\)/g, 
        '<video controls width="100%" style="border-radius: 8px; margin: 12px 0;"><source src="$1" type="video/mp4"></video>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
  
  function formatMarkdown(content) {
    return content
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Code blocks and inline code
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Lists
      .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
      .replace(/^[\-\*]\s+(.*)$/gm, '<li>$1</li>')
      
      // Wrap consecutive list items
      .replace(/(<li>.*?<\/li>\s*)+/g, '<ul>$&</ul>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph if not already wrapped
      .replace(/^(?!<[h|u|p|d])(.+)$/gm, '<p>$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '');
  }
  
  // Initialize widget
  // Firebase is optional - only needed for advanced tracking
  // Main functionality works via secure API endpoints
  if (config.firebaseConfig) {
    loadFirebase();
  } else {
    console.log('ProductFlow: Running in API-only mode (no Firebase config)');
    // Initialize tracking without Firebase
    if (window.productflowTracking) {
      window.productflowTracking.db = null; // Disable Firebase-dependent tracking
    }
  }
  
  // Public API
  window.productflow_openWidget = openWidget;
  window.productflow_closeWidget = closeWidget;
})();