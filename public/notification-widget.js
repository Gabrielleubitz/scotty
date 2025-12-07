// ProductFlow Notification Badge Widget - Firestore Integration
(function() {
  // Get configuration from global variable or use defaults
  const config = window.productflow_notification_config || {
    product_id: 'YOUR_PRODUCT_ID',
    targetSelector: '#productflow-notification',
    badgePosition: 'top-right',
    badgeColor: '#ef4444',
    textColor: '#ffffff',
    fontSize: '12px',
    checkInterval: 30000,
    showZero: false,
    maxCount: 99,
    onClick: null
  };

  // Firebase configuration - matches main app
  config.firebaseConfig = config.firebaseConfig || {
    apiKey: "AIzaSyD7tlbe2_A9JCOAcpS7QNRkn9wcoLQ6bE4",
    authDomain: "scotty-acfe5.firebaseapp.com",
    projectId: "scotty-acfe5",
    storageBucket: "scotty-acfe5.firebasestorage.app",
    messagingSenderId: "1048370427467",
    appId: "1:1048370427467:web:90127c22dbebc20eacffce"
  };

  // Position styles mapping
  const positionStyles = {
    'top-right': 'top: -8px; right: -8px;',
    'top-left': 'top: -8px; left: -8px;',
    'bottom-right': 'bottom: -8px; right: -8px;',
    'bottom-left': 'bottom: -8px; left: -8px;'
  };

  // Create badge styles
  const styles = `
    .productflow-notification-badge {
      position: absolute;
      ${positionStyles[config.badgePosition] || positionStyles['top-right']}
      background: ${config.badgeColor};
      color: ${config.textColor};
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${config.fontSize};
      font-weight: 700;
      line-height: 1;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border: 2px solid #ffffff;
      animation: productflow-badge-appear 0.3s ease-out;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    
    .productflow-notification-badge:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .productflow-notification-badge.productflow-pulse {
      animation: productflow-badge-pulse 2s infinite;
    }
    
    @keyframes productflow-badge-appear {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes productflow-badge-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .productflow-notification-container {
      position: relative;
      display: inline-block;
    }
    
    .productflow-notification-badge.productflow-hidden {
      display: none !important;
    }
  `;
  
  // Add styles to page
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  
  let currentCount = 0;
  let badge = null;
  let targetElement = null;
  let containerElement = null;
  let checkInterval = null;
  let db = null;
  let userId = null;

  // Initialize Firebase and widget
  function initializeWidget() {
    console.log('🚀 Initializing ProductFlow Notification Widget with Firestore...');
    console.log('Config:', config);
    
    // Load Firebase first, then initialize widget
    loadFirebase();
  }

  function loadFirebase() {
    console.log('📦 Loading Firebase SDK...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/firebase@9.23.0/firebase-app.js';
    script.onload = function() {
      const firestoreScript = document.createElement('script');
      firestoreScript.src = 'https://cdn.jsdelivr.net/npm/firebase@9.23.0/firebase-firestore.js';
      firestoreScript.onload = function() {
        initializeFirebase();
      };
      document.head.appendChild(firestoreScript);
    };
    document.head.appendChild(script);
  }

  function initializeFirebase() {
    console.log('🔥 Initializing Firebase...');
    
    try {
      // Initialize Firebase
      firebase.initializeApp(config.firebaseConfig);
      db = firebase.firestore();
      
      console.log('✅ Firebase initialized successfully');
      
      // Get or create user ID
      userId = getUserId();
      console.log('👤 User ID:', userId);
      
      // Now initialize the widget UI
      initializeWidgetUI();
      
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      // Fallback: show error state
      initializeWidgetUI();
    }
  }

  function initializeWidgetUI() {
    console.log('🎨 Initializing widget UI...');
    
    // Find target element
    targetElement = document.querySelector(config.targetSelector);
    if (!targetElement) {
      console.warn(`ProductFlow Notification: Target element "${config.targetSelector}" not found`);
      return;
    }
    
    console.log('✅ Target element found:', targetElement);

    // Wrap target element if not already wrapped
    if (!targetElement.parentElement.classList.contains('productflow-notification-container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'productflow-notification-container';
      targetElement.parentNode.insertBefore(wrapper, targetElement);
      wrapper.appendChild(targetElement);
      containerElement = wrapper;
      console.log('✅ Container wrapper created');
    } else {
      containerElement = targetElement.parentElement;
      console.log('✅ Using existing container');
    }

    // Create badge element
    createBadge();
    
    // Initial check
    checkForNewNotifications();
    
    // Set up periodic checking
    if (config.checkInterval > 0) {
      checkInterval = setInterval(checkForNewNotifications, config.checkInterval);
      console.log('✅ Periodic checking enabled. Interval:', config.checkInterval + 'ms');
    }
  }

  function createBadge() {
    // Remove existing badge if it exists
    const existingBadge = containerElement.querySelector('.productflow-notification-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    badge = document.createElement('div');
    badge.className = 'productflow-notification-badge';
    badge.textContent = '0';
    
    // Start hidden if showZero is false
    if (!config.showZero) {
      badge.classList.add('productflow-hidden');
    }
    
    containerElement.appendChild(badge);
    
    // Add click handler to the entire container (includes bell icon and badge)
    containerElement.addEventListener('click', handleBadgeClick);
    
    console.log('✅ Badge created and added to container');
  }

  function getUserId() {
    let userId = localStorage.getItem('productflow_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('productflow_user_id', userId);
      console.log('🆕 Created new user ID:', userId);
    } else {
      console.log('♻️ Using existing user ID:', userId);
    }
    return userId;
  }

  async function checkForNewNotifications() {
    if (!db || !userId) {
      console.warn('⚠️ Firebase not initialized or user ID missing');
      updateBadge(0);
      return;
    }

    try {
      console.log('🔄 Checking for new notifications via Firestore...');
      
      const currentDomain = window.location.hostname;
      console.log('🌐 Current domain:', currentDomain);
      
      // Step 1: Get all published posts
      const postsQuery = db.collection('changelog')
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc');
      
      const postsSnapshot = await postsQuery.get();
      console.log('📄 Total published posts:', postsSnapshot.docs.length);
      
      if (postsSnapshot.empty) {
        console.log('📭 No published posts found');
        updateBadge(0);
        return;
      }

      // Step 2: Filter posts by domain/segment (if applicable)
      let relevantPosts = [];
      
      try {
        // Get segments to filter by domain
        const segmentsSnapshot = await db.collection('segments').get();
        const segments = segmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('🏷️ Available segments:', segments.length);
        
        // Find segment for current domain
        const currentSegment = segments.find(segment => 
          segment.domain === currentDomain || 
          segment.domain === `www.${currentDomain}` ||
          `www.${segment.domain}` === currentDomain
        );
        
        console.log('🎯 Current segment:', currentSegment);
        
        // Filter posts based on segment
        relevantPosts = postsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => {
            if (!currentSegment) {
              // No segment for this domain, show posts without segments
              return !post.segmentId;
            } else {
              // Show posts for this segment + posts without segments
              return !post.segmentId || post.segmentId === currentSegment.id;
            }
          });
          
      } catch (segmentError) {
        console.warn('⚠️ Error loading segments, showing all posts:', segmentError);
        relevantPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      console.log('📋 Relevant posts for domain:', relevantPosts.length);
      
      if (relevantPosts.length === 0) {
        updateBadge(0);
        return;
      }

      // Step 3: Get user's last read timestamp
      const userReadDocId = `${userId}_${config.product_id}`;
      console.log('🔍 Checking user read state from document:', userReadDocId);
      const userReadDoc = await db.collection('user_read_states').doc(userReadDocId).get();
      
      let lastReadTimestamp = null;
      if (userReadDoc.exists) {
        console.log('✅ User read state document found.');
        const data = userReadDoc.data();
        lastReadTimestamp = data.lastReadTimestamp;
        console.log('📖 User last read timestamp:', lastReadTimestamp ? lastReadTimestamp.toDate() : 'Never');
      } else {
        console.log('❌ User read state document NOT found.');
        console.log('📖 User has never read posts');
      }

      // Step 4: Count unread posts
      let unreadCount = 0;
      
      if (!lastReadTimestamp) {
        // User has never read any posts, all are unread
        unreadCount = relevantPosts.length;
        console.log('🆕 User has never read posts, all are unread:', unreadCount);
      } else {
        // Count posts created after last read timestamp
        unreadCount = relevantPosts.filter(post => {
          const postCreatedAt = post.createdAt.toDate();
          const isUnread = postCreatedAt > lastReadTimestamp.toDate();
          if (isUnread) {
            console.log('📰 Unread post:', post.title, 'created:', postCreatedAt);
          }
          return isUnread;
        }).length;
        
        console.log('🔢 Posts created after last read:', unreadCount);
      }
      
      // Step 5: Update badge
      updateBadge(unreadCount);
      console.log('✅ Notification check completed. Unread count:', unreadCount);
      
    } catch (error) {
      console.error('❌ Error checking for notifications:', error);
      updateBadge(0);
    }
  }

  async function handleBadgeClick() {
    console.log('🔔 Badge clicked! Current count:', currentCount);
    
    if (!db || !userId) {
      console.warn('⚠️ Firebase not initialized or user ID missing');
      return;
    }
    
    // Reset count and hide badge immediately for UX
    updateBadge(0);
    
    try {
      // Mark all posts as read by updating user's last read timestamp
      const userReadDocId = `${userId}_${config.product_id}`;
      const now = new Date();
      
      console.log('📝 Marking all posts as read for user:', userId);
      console.log('⏰ Setting last read timestamp to:', now);
      console.log('💾 Attempting to save user read state to document:', userReadDocId);
      
      await db.collection('user_read_states').doc(userReadDocId).set({
        userId: userId,
        productId: config.product_id,
        domain: window.location.hostname,
        lastReadTimestamp: firebase.firestore.Timestamp.fromDate(now),
        updatedAt: firebase.firestore.Timestamp.fromDate(now)
      });
      
      console.log('✅ Successfully marked all posts as read');
      
    } catch (error) {
      console.error('❌ Error marking posts as read:', error);
    }
    
    // Call custom onClick handler if provided
    if (typeof config.onClick === 'function') {
      console.log('🎯 Calling custom onClick handler');
      config.onClick(currentCount);
    } else {
      // Default behavior: open the main widget if available
      if (window.productflow_openWidget) {
        console.log('🎯 Opening main ProductFlow widget');
        window.productflow_openWidget();
      } else {
        // Fallback: show alert or redirect
        console.log('🎯 Fallback: No main widget available');
        alert('All notifications marked as read!');
      }
    }
  }

  function updateBadge(count) {
    if (!badge) {
      console.warn('⚠️ Badge element not found for update');
      return;
    }
    
    console.log('🔄 Updating badge. Count:', count);
    
    currentCount = count;
    
    if (count === 0 && !config.showZero) {
      badge.classList.add('productflow-hidden');
      badge.classList.remove('productflow-pulse');
      console.log('🙈 Badge hidden (count is 0)');
    } else {
      badge.classList.remove('productflow-hidden');
      
      // Format count display
      let displayCount = count;
      if (count > config.maxCount) {
        displayCount = `${config.maxCount}+`;
      }
      
      badge.textContent = displayCount;
      console.log('👁️ Badge shown with count:', displayCount);
      
      // Add pulse animation for new notifications
      if (count > 0) {
        badge.classList.add('productflow-pulse');
        console.log('✨ Pulse animation added');
        
        // Remove pulse after 6 seconds
        setTimeout(() => {
          if (badge) {
            badge.classList.remove('productflow-pulse');
            console.log('✨ Pulse animation removed');
          }
        }, 6000);
      }
    }
  }

  // Debug function
  function debugWidget() {
    console.log('=== ProductFlow Notification Debug ===');
    console.log('Firebase initialized:', !!db);
    console.log('User ID:', userId);
    console.log('Target element:', targetElement);
    console.log('Container element:', containerElement);
    console.log('Badge element:', badge);
    console.log('Current count:', currentCount);
    console.log('Config:', config);
    console.log('Badge classes:', badge ? badge.className : 'No badge');
    console.log('Badge text:', badge ? badge.textContent : 'No badge');
    console.log('Badge visible:', badge ? !badge.classList.contains('productflow-hidden') : 'No badge');
  }

  // Public API
  window.productflow_notification = {
    checkNow: checkForNewNotifications,
    reset: async function() {
      if (db && userId) {
        const userReadDocId = `${userId}_${config.product_id}`;
        await db.collection('user_read_states').doc(userReadDocId).delete();
      }
      updateBadge(0);
    },
    getCount: function() {
      return currentCount;
    },
    updateConfig: function(newConfig) {
      Object.assign(config, newConfig);
      if (badge) {
        badge.remove();
        createBadge();
      }
    },
    destroy: function() {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (badge) {
        badge.remove();
      }
    },
    debug: debugWidget
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }
})();