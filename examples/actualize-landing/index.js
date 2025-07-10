import { 
  createTimeline, 
  animate, 
  utils, 
  stagger
} from '../../lib/anime.esm.js';

// Demo prompts with different design types
const demoPrompts = [
  {
    text: "design a modern logo for a tech startup",
    type: "logo",
    design: {
      mockupType: "logo",
      primaryColor: 'linear-gradient(135deg, #667eea, #764ba2)',
      secondaryColor: '#ffffff',
      accentColor: '#ff6b6b'
    }
  },
  {
    text: "create a mobile app interface for food delivery",
    type: "mobile",
    design: {
      mockupType: "mobile",
      primaryColor: 'linear-gradient(135deg, #f093fb, #f5576c)',
      secondaryColor: '#ffffff',
      accentColor: '#4ecdc4'
    }
  },
  {
    text: "build a landing page for a SaaS product",
    type: "website",
    design: {
      mockupType: "website",
      primaryColor: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      secondaryColor: '#f8f9fa',
      accentColor: '#28a745'
    }
  },
  {
    text: "design a poster for a music festival",
    type: "poster",
    design: {
      mockupType: "poster",
      primaryColor: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
      secondaryColor: '#2c3e50',
      accentColor: '#f39c12'
    }
  },
  {
    text: "create business cards for a creative agency",
    type: "business-card",
    design: {
      mockupType: "business-card",
      primaryColor: 'linear-gradient(135deg, #a8edea, #fed6e3)',
      secondaryColor: '#34495e',
      accentColor: '#e74c3c'
    }
  },
  {
    text: "design a book cover for a sci-fi novel",
    type: "book",
    design: {
      mockupType: "book",
      primaryColor: 'linear-gradient(135deg, #667eea, #764ba2)',
      secondaryColor: '#1a1a1a',
      accentColor: '#00d4ff'
    }
  },
  {
    text: "create a social media post template",
    type: "social",
    design: {
      mockupType: "social",
      primaryColor: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
      secondaryColor: '#ffffff',
      accentColor: '#ff6b6b'
    }
  }
];

// Design type display names
const designTypeNames = {
  logo: "Logo Design",
  mobile: "Mobile App",
  website: "Website",
  poster: "Poster Design", 
  "business-card": "Business Card",
  book: "Book Cover",
  social: "Social Media"
};

// State management
let currentPromptIndex = 0;
let isTyping = false;
let typingTimer = null;
let demoLoop = null;
let errorCount = 0;
let continuousAnimations = [];
let isAutoDemo = true;
let demoTimeout = null;
let initialLoadTimeout = null;
let hasManuallyNavigated = false;

// Elements will be retrieved dynamically to avoid null references

// Error handling and logging
function logError(error, context = '') {
  errorCount++;
  const errorInfo = {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    promptIndex: currentPromptIndex,
    isTyping,
    errorCount
  };
  
  if (!window.actualizeErrors) window.actualizeErrors = [];
  window.actualizeErrors.push(errorInfo);
  
  // Update error bubble
  updateErrorBubble();
  
  return errorInfo;
}

// Update error bubble display
function updateErrorBubble() {
  const $bubble = document.getElementById('error-bubble');
  const $count = document.getElementById('error-count');
  const $list = document.getElementById('error-list');
  
  if (!$bubble || !window.actualizeErrors) return;
  
  const errorCount = window.actualizeErrors.length;
  
  if (errorCount > 0) {
    $bubble.classList.add('visible');
    $count.textContent = errorCount;
    
    // Update error list
    $list.innerHTML = window.actualizeErrors.map((error, index) => {
      const time = new Date(error.timestamp).toLocaleTimeString();
      const location = getErrorLocation(error.stack);
      
      return `
        <div class="error-item">
          <div class="error-message">${error.error}</div>
          <div class="error-context">Context: ${error.context}</div>
          <div class="error-location">${location}</div>
          <div class="error-time">${time}</div>
        </div>
      `;
    }).reverse().join(''); // Show newest first
  } else {
    $bubble.classList.remove('visible');
  }
}

// Extract error location from stack trace
function getErrorLocation(stack) {
  if (!stack) return 'Unknown location';
  
  const lines = stack.split('\n');
  for (const line of lines) {
    if (line.includes('.js:') && !line.includes('logError')) {
      const match = line.match(/([^/]+\.js):(\d+):(\d+)/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }
  }
  return 'Unknown location';
}

// Setup error bubble interactions
function setupErrorBubble() {
  const $bubble = document.getElementById('error-bubble');
  const $panel = document.getElementById('error-panel');
  const $close = document.getElementById('error-close');
  
  if (!$bubble || !$panel || !$close) return;
  
  let panelOpen = false;
  
  // Handle both click and keyboard events
  const togglePanel = () => {
    panelOpen = !panelOpen;
    $panel.classList.toggle('visible', panelOpen);
    
    if (panelOpen) {
      $close.focus(); // Focus close button when opened
    }
  };
  
  $bubble.addEventListener('click', togglePanel);
  $bubble.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  });
  
  $close.addEventListener('click', (e) => {
    e.stopPropagation();
    panelOpen = false;
    $panel.classList.remove('visible');
  });
  
  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!$bubble.contains(e.target) && !$panel.contains(e.target)) {
      panelOpen = false;
      $panel.classList.remove('visible');
    }
  });
}

// Global error retrieval function for debugging
window.getActualizeErrors = function() {
  return window.actualizeErrors || [];
};

// Safe wrapper for animations
function safeAnimate(target, props, options = {}) {
  try {
    return animate(target, props, options);
  } catch (error) {
    logError(error, `safeAnimate: ${target}`);
    return Promise.resolve();
  }
}

// Safe wrapper for timelines
function safeTimeline(options = {}) {
  try {
    return createTimeline(options);
  } catch (error) {
    logError(error, 'safeTimeline');
    return { add: () => ({}) };
  }
}

// Simplified looping utility
function createSimpleLoop(elements, animProps, duration = 4000) {
  elements.forEach((el, i) => {
    safeAnimate(el, {
      ...animProps,
      duration: duration,
      loop: true,
      delay: i * 200
    });
  });
}



// Stop all current animations and timers
function stopAllAnimations() {
  try {
    // Stop typing animation
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    
    // Stop demo timeout
    if (demoTimeout) {
      clearTimeout(demoTimeout);
      demoTimeout = null;
    }
    
    // Stop all continuous animations
    continuousAnimations.forEach(anim => {
      if (anim && anim.pause) {
        anim.pause();
      }
    });
    continuousAnimations = [];
    
    // Reset typing state
    isTyping = false;
    
    // Clear any anime.js animations on design elements
    const animatedElements = [
      '.mockup-element',
      '.logo-shape', 
      '.logo-particle',
      '.mobile-card',
      '.poster-header',
      '.card-front',
      '.card-back',
      '.book-cover',
      '.social-post',
      '.pattern-dot',
      '.design-preview',
      '.design-mockup',
      '.mobile-frame',
      '.mobile-header',
      '.mobile-tab',
      '.hero-image',
      '.poster-frame',
      '.poster-image',
      '.poster-title',
      '.poster-subtitle',
      '.detail-line',
      '.poster-footer',
      '.card-logo',
      '.card-info',
      '.card-name',
      '.card-title',
      '.contact-line',
      '.card-pattern',
      '.card-details',
      '.book-cover',
      '.book-title',
      '.book-author',
      '.book-image',
      '.book-publisher',
      '.social-header',
      '.social-image',
      '.social-actions',
      '.social-caption',
      '.social-button',
      '.header-element',
      '.content-element',
      '.cta-element'
    ];
    
    animatedElements.forEach(selector => {
      const elements = utils.$(selector);
      elements.forEach(el => {
        if (el && el.style) {
          // Reset all animation-related CSS properties
          el.style.transform = '';
          el.style.opacity = '';
          el.style.scale = '';
          el.style.rotate = '';
          el.style.translate = '';
          el.style.filter = '';
          el.style.background = '';
          el.style.boxShadow = '';
          
          // Remove any anime.js data attributes
          if (el.removeAttribute) {
            const attributes = [...el.attributes].filter(attr => 
              attr.name.startsWith('data-anime') || 
              attr.name.startsWith('style')
            );
            attributes.forEach(attr => {
              if (attr.name.startsWith('data-anime')) {
                el.removeAttribute(attr.name);
              }
            });
          }
        }
      });
    });
    
  } catch (error) {
    logError(error, 'stopAllAnimations');
  }
}

// Navigation Functions
function updateDesignInfo() {
  try {
    const $designType = utils.$('#current-design-type')[0];
    const $currentIndex = utils.$('#current-index')[0];
    const $totalDesigns = utils.$('#total-designs')[0];
    
    if (!$designType || !$currentIndex || !$totalDesigns) return;
    
    const currentPrompt = demoPrompts[currentPromptIndex];
    $designType.textContent = designTypeNames[currentPrompt.type] || 'Unknown Design';
    $currentIndex.textContent = currentPromptIndex + 1;
    $totalDesigns.textContent = demoPrompts.length;
  } catch (error) {
    logError(error, 'updateDesignInfo');
  }
}

function navigateToDesign(index, immediate = false) {
  try {
    // Immediately stop all current animations and timers
    stopAllAnimations();
    
    // Mark as manually navigated if this isn't the initial load
    if (!immediate) {
      hasManuallyNavigated = true;
      
      // Clear initial load timeout to prevent auto demo from starting
      if (initialLoadTimeout) {
        clearTimeout(initialLoadTimeout);
        initialLoadTimeout = null;
      }
    }
    
    // Pause auto demo when manually navigating
    if (isAutoDemo && !immediate) {
      toggleAutoDemo();
    }
    
    currentPromptIndex = index;
    updateDesignInfo();
    
    const prompt = demoPrompts[currentPromptIndex];
    const $typedText = utils.$('#typed-text')[0];
    
    if (!$typedText || !prompt) return;
    
    // For manual navigation, show results immediately without typing animation
    if (!immediate && !isAutoDemo) {
      // Manual navigation - show immediately
      $typedText.textContent = prompt.text;
      setTimeout(() => {
        animateDesignChange(prompt.design);
      }, 200);
    } else if (immediate) {
      // Initial load - show immediately
      $typedText.textContent = prompt.text;
      animateDesignChange(prompt.design);
    } else {
      // Auto demo - use typing animation
      clearText(() => {
        setTimeout(() => {
          if (!isAutoDemo) return; // Check if still in auto mode
          typeText(prompt.text, () => {
            setTimeout(() => {
              if (!isAutoDemo) return; // Check again
              animateDesignChange(prompt.design);
            }, 800);
          });
        }, 300);
      });
    }
  } catch (error) {
    logError(error, 'navigateToDesign');
  }
}

function navigatePrevious() {
  try {
    const newIndex = currentPromptIndex === 0 ? demoPrompts.length - 1 : currentPromptIndex - 1;
    navigateToDesign(newIndex);
  } catch (error) {
    logError(error, 'navigatePrevious');
  }
}

function navigateNext() {
  try {
    const newIndex = (currentPromptIndex + 1) % demoPrompts.length;
    navigateToDesign(newIndex);
  } catch (error) {
    logError(error, 'navigateNext');
  }
}

function reloadCurrentDesign() {
  try {
    // Stop all current animations first
    stopAllAnimations();
    
    // Pause auto demo if it's running
    if (isAutoDemo) {
      toggleAutoDemo();
    }
    
    const prompt = demoPrompts[currentPromptIndex];
    const $typedText = utils.$('#typed-text')[0];
    
    if (!$typedText || !prompt) return;
    
    // Show the current prompt text immediately and animate the design
    $typedText.textContent = prompt.text;
    setTimeout(() => {
      animateDesignChange(prompt.design);
    }, 200);
    
  } catch (error) {
    logError(error, 'reloadCurrentDesign');
  }
}

function toggleAutoDemo() {
  try {
    isAutoDemo = !isAutoDemo;
    
    const $playPauseBtn = utils.$('#play-pause-btn')[0];
    const $playIcon = utils.$('#play-icon')[0];
    const $pauseIcon = utils.$('#pause-icon')[0];
    const $controlLabel = utils.$('#control-label')[0];
    
    if (!$playPauseBtn || !$playIcon || !$pauseIcon || !$controlLabel) return;
    
    if (isAutoDemo) {
      // Resume auto demo
      $playPauseBtn.classList.remove('paused');
      $playIcon.style.display = 'none';
      $pauseIcon.style.display = 'block';
      $controlLabel.textContent = 'Auto Demo';
      $playPauseBtn.setAttribute('aria-label', 'Pause auto demo');
      
      // Clear any existing timeout and restart demo
      if (demoTimeout) clearTimeout(demoTimeout);
      demoTimeout = setTimeout(() => {
        if (isAutoDemo) startDemoLoop();
      }, 3000);
    } else {
      // Pause auto demo
      $playPauseBtn.classList.add('paused');
      $playIcon.style.display = 'block';
      $pauseIcon.style.display = 'none';
      $controlLabel.textContent = 'Manual';
      $playPauseBtn.setAttribute('aria-label', 'Resume auto demo');
      
      // Clear demo timeout
      if (demoTimeout) {
        clearTimeout(demoTimeout);
        demoTimeout = null;
      }
    }
  } catch (error) {
    logError(error, 'toggleAutoDemo');
  }
}

function setupNavigationControls() {
  try {
    const $prevBtn = utils.$('#prev-design')[0];
    const $nextBtn = utils.$('#next-design')[0];
    const $playPauseBtn = utils.$('#play-pause-btn')[0];
    const $designType = utils.$('#current-design-type')[0];
    
    if (!$prevBtn || !$nextBtn || !$playPauseBtn) return;
    
    // Add event listeners
    $prevBtn.addEventListener('click', navigatePrevious);
    $nextBtn.addEventListener('click', navigateNext);
    $playPauseBtn.addEventListener('click', toggleAutoDemo);
    
    // Add reload functionality to design type text
    if ($designType) {
      $designType.addEventListener('click', reloadCurrentDesign);
      $designType.setAttribute('title', 'Click to reload current design');
      $designType.setAttribute('aria-label', 'Reload current design');
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoDemo();
          break;
      }
    });
    
    // Initialize display
    updateDesignInfo();
  } catch (error) {
    logError(error, 'setupNavigationControls');
  }
}

// Initialize everything
function init() {
  try {
    setupPageAnimations();
    setupBackgroundAnimations();
    setupErrorBubble();
    setupNavigationControls();
    
    initialLoadTimeout = setTimeout(() => {
      // Only start auto demo if user hasn't manually navigated
      if (isAutoDemo && !hasManuallyNavigated) {
        startDemoLoop();
      } else if (!hasManuallyNavigated) {
        // Show first design immediately if not auto and no manual navigation
        navigateToDesign(0, true);
      }
      initialLoadTimeout = null;
    }, 2000);
  } catch (error) {
    logError(error, 'init');
  }
}

// Simple, elegant page entrance animations
function setupPageAnimations() {
  try {
    // Get elements
    const $heroSection = utils.$('.hero-section')[0];
    const $demoContainer = utils.$('.demo-container')[0];
    const $header = utils.$('.header')[0];
    const $designControls = utils.$('.design-controls')[0];
    
    if (!$heroSection || !$demoContainer || !$header) {
      return;
    }
    
    // Set initial states
    utils.set($heroSection, {
        opacity: 0,
      translateY: 20
    });
    
    utils.set($demoContainer, { 
      opacity: 0, 
      translateY: 20
    });
    
    utils.set($header, { 
      opacity: 0,
      translateY: -10
    });

    if ($designControls) {
      utils.set($designControls, {
        opacity: 0,
        translateY: 10
      });
    }
    
    // Create clean entrance timeline
    const entranceTimeline = safeTimeline({
      autoplay: true,
      defaults: { ease: 'outQuart' }
    });
    
    // Header entrance
    entranceTimeline.add($header, {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 600
    });
    
    // Hero section entrance
    entranceTimeline.add($heroSection, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      ease: 'outQuart'
    }, 200);
    
    // Demo container entrance
     entranceTimeline.add($demoContainer, {
       opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      ease: 'outQuart'
    }, 400);

    // Design controls entrance
    if ($designControls) {
      entranceTimeline.add($designControls, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        ease: 'outQuart'
      }, 600);
    }
    
  } catch (error) {
    logError(error, 'setupPageAnimations');
  }
}



// Simple background animations
function setupBackgroundAnimations() {
  try {
    const $lines = utils.$('.draw-line');
    if ($lines.length === 0) return;
    
    // Simple continuous opacity pulse for lines
    $lines.forEach((line, i) => {
      safeAnimate(line, {
        opacity: [0.1, 0.3, 0.1],
        duration: 4000 + (i * 500), // Staggered durations
        ease: 'inOutSine',
      loop: true,
        delay: i * 1000 // Staggered start
      });
    });
    
  } catch (error) {
    logError(error, 'setupBackgroundAnimations');
  }
}
// Create dynamic mockup based on design type
function createMockupHTML(designType) {
  const mockups = {
    logo: `
      <div class="mockup-logo">
        <div class="logo-container">
          <div class="logo-main">
            <div class="logo-shape logo-primary"></div>
            <div class="logo-shape logo-secondary"></div>
            <div class="logo-shape logo-accent"></div>
            <div class="logo-particles">
              ${Array.from({length: 8}, (_, i) => `<div class="logo-particle logo-particle-${i}"></div>`).join('')}
            </div>
          </div>
          <div class="logo-text">
            <div class="logo-line logo-line-1"></div>
            <div class="logo-line logo-line-2"></div>
            <div class="logo-line logo-line-3"></div>
          </div>
        </div>
        <div class="logo-variations">
          <div class="logo-variant logo-variant-1">
            <div class="variant-shape"></div>
          </div>
          <div class="logo-variant logo-variant-2">
            <div class="variant-shape"></div>
          </div>
          <div class="logo-variant logo-variant-3">
            <div class="variant-shape"></div>
          </div>
        </div>
      </div>
    `,
    mobile: `
      <div class="mockup-mobile">
        <div class="mobile-frame">
          <div class="mobile-header">
            <div class="mobile-status-bar">
              <div class="status-indicators">
                <div class="status-dot"></div>
                <div class="status-dot"></div>
                <div class="status-dot"></div>
              </div>
            </div>
            <div class="mobile-nav-bar"></div>
          </div>
          <div class="mobile-content">
            <div class="mobile-hero">
              <div class="hero-image"></div>
              <div class="hero-text"></div>
            </div>
            <div class="mobile-cards">
              <div class="mobile-card card-1"></div>
              <div class="mobile-card card-2"></div>
              <div class="mobile-card card-3"></div>
            </div>
            <div class="mobile-bottom-nav">
              <div class="mobile-tab tab-1"></div>
              <div class="mobile-tab tab-2"></div>
              <div class="mobile-tab tab-3"></div>
              <div class="mobile-tab tab-4"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    website: `
      <div class="mockup-browser">
        <div class="browser-header">
          <div class="browser-dot dot-red"></div>
          <div class="browser-dot dot-yellow"></div>
          <div class="browser-dot dot-green"></div>
        </div>
        <div class="browser-content">
          <div class="mockup-element header-element"></div>
          <div class="content-sections">
            <div class="mockup-element content-element" style="width: 85%;"></div>
            <div class="mockup-element content-element" style="width: 70%;"></div>
            <div class="mockup-element content-element" style="width: 95%;"></div>
          </div>
          <div class="mockup-element cta-element"></div>
        </div>
      </div>
    `,
    poster: `
      <div class="mockup-poster">
        <div class="poster-frame">
          <div class="poster-header">
            <div class="header-pattern"></div>
          </div>
          <div class="poster-image">
            <div class="image-overlay"></div>
          </div>
          <div class="poster-text">
            <div class="poster-title"></div>
            <div class="poster-subtitle"></div>
            <div class="poster-details">
              <div class="detail-line"></div>
              <div class="detail-line"></div>
            </div>
          </div>
          <div class="poster-footer">
            <div class="footer-elements">
              <div class="footer-element"></div>
              <div class="footer-element"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    'business-card': `
      <div class="mockup-business-card">
        <div class="card-front">
          <div class="card-logo">
            <div class="logo-symbol"></div>
          </div>
          <div class="card-info">
            <div class="card-name"></div>
            <div class="card-title"></div>
            <div class="card-contact">
              <div class="contact-line"></div>
              <div class="contact-line"></div>
            </div>
          </div>
        </div>
        <div class="card-back">
          <div class="card-pattern">
            <div class="pattern-elements">
              ${Array.from({length: 6}, (_, i) => `<div class="pattern-dot pattern-dot-${i}"></div>`).join('')}
            </div>
          </div>
          <div class="card-details"></div>
        </div>
      </div>
    `,
    book: `
      <div class="mockup-book">
        <div class="book-cover">
          <div class="book-spine"></div>
          <div class="book-front">
            <div class="book-title">
              <div class="title-text"></div>
            </div>
            <div class="book-author"></div>
            <div class="book-image">
              <div class="image-decoration"></div>
            </div>
            <div class="book-publisher"></div>
          </div>
        </div>
      </div>
    `,
    social: `
      <div class="mockup-social">
        <div class="social-post">
          <div class="social-header">
            <div class="social-avatar">
              <div class="avatar-ring"></div>
            </div>
            <div class="social-username"></div>
          </div>
          <div class="social-image">
            <div class="image-effects">
              <div class="effect-overlay"></div>
            </div>
          </div>
          <div class="social-actions">
            <div class="social-button btn-1"></div>
            <div class="social-button btn-2"></div>
            <div class="social-button btn-3"></div>
          </div>
          <div class="social-caption">
            <div class="caption-lines">
              <div class="caption-line"></div>
              <div class="caption-line"></div>
            </div>
          </div>
        </div>
      </div>
    `
  };
  
  return mockups[designType] || mockups.website;
}

// Typewriter effect
function typeText(text, onComplete) {
  if (isTyping) return;
  
  try {
    isTyping = true;
    const $typedText = utils.$('#typed-text')[0];
    
    if (!$typedText) {
      if (onComplete) onComplete();
      return;
    }
    
    $typedText.textContent = '';
    
    let charIndex = 0;
    const chars = text.split('');
    
    const typeChar = () => {
      try {
        // Check if typing was interrupted
        if (!isTyping) {
          if (onComplete) onComplete();
          return;
        }
        
        if (charIndex < chars.length) {
          $typedText.textContent += chars[charIndex];
          charIndex++;
          
          // Natural typing rhythm
          let delay;
          if (chars[charIndex - 1] === ' ') {
            delay = utils.random(150, 300);
          } else if (chars[charIndex - 1] === ',') {
            delay = utils.random(200, 400);
          } else {
            delay = utils.random(50, 150);
          }
          
          typingTimer = setTimeout(typeChar, delay);
        } else {
          isTyping = false;
          if (onComplete) onComplete();
        }
      } catch (error) {
        logError(error, 'typeChar');
        isTyping = false;
        if (onComplete) onComplete();
      }
    };
    
    typeChar();
  } catch (error) {
    logError(error, 'typeText');
    isTyping = false;
    if (onComplete) onComplete();
  }
}

// Clear text with backspace effect
function clearText(onComplete) {
  if (isTyping) return;
  
  try {
    isTyping = true;
    const $typedText = utils.$('#typed-text')[0];
    
    if (!$typedText) {
      if (onComplete) onComplete();
      return;
    }
    
    const text = $typedText.textContent;
    const chars = text.split('');
    
    let charIndex = chars.length - 1;
    
    const deleteChar = () => {
      try {
        // Check if typing was interrupted
        if (!isTyping) {
          if (onComplete) onComplete();
          return;
        }
        
        if (charIndex >= 0) {
          chars.pop();
          $typedText.textContent = chars.join('');
          charIndex--;
          
          // Accelerating deletion
          const delay = Math.max(20, utils.random(20, 60) * (charIndex / chars.length));
          typingTimer = setTimeout(deleteChar, delay);
        } else {
          isTyping = false;
          // Prefix stays visible always
          if (onComplete) onComplete();
        }
      } catch (error) {
        logError(error, 'deleteChar');
        isTyping = false;
        if (onComplete) onComplete();
      }
    };
    
    deleteChar();
  } catch (error) {
    logError(error, 'clearText');
    isTyping = false;
    if (onComplete) onComplete();
  }
}

// Animate design changes
function animateDesignChange(designConfig) {
  try {
    // Clear previous continuous animations
    continuousAnimations.forEach(anim => {
      if (anim.pause) anim.pause();
    });
    
    const $designPreview = utils.$('#design-preview')[0];
    const $designMockup = utils.$('#design-mockup')[0];
    const $statusIndicator = utils.$('#status-indicator')[0];
    
    if (!$designPreview || !$designMockup || !$statusIndicator) {
      return;
    }
    
    $designMockup.innerHTML = createMockupHTML(designConfig.mockupType);
    
    // Container entrance animation
    safeAnimate($designPreview, {
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.9, 1],
      rotateX: [-10, 0],
      duration: 800,
      ease: 'outExpo'
    });
    
    safeAnimate($statusIndicator, {
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      ease: 'outQuart'
    });
    
    safeAnimate($designMockup, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 1000,
      ease: 'outExpo',
      delay: 400
    });
    
    setTimeout(() => {
      animateSpecificDesign(designConfig);
    }, 600);
    
  } catch (error) {
    logError(error, 'animateDesignChange');
  }
}

// Logo animation with organic movements
function animateLogoDesign(primaryColor, accentColor) {
  try {
    const $logoShapes = utils.$('.logo-shape');
    const $logoParticles = utils.$('.logo-particle');
    const $logoLines = utils.$('.logo-line');
    const $logoVariants = utils.$('.logo-variant');
    
    // Main logo entrance with organic flow
    const logoTimeline = safeTimeline({
      defaults: { ease: 'outExpo' }
    });
    
    // Animate main shapes with dynamic movement
    logoTimeline.add($logoShapes, {
      opacity: [0, 1],
      scale: [0, 1.2, 1],
      rotate: [0, utils.random(-30, 30), 0],
      duration: 1000,
      delay: stagger(150, { from: 'center' })
    });
    
    // Animate particles with organic pattern
    logoTimeline.add($logoParticles, {
      opacity: [0, 1],
      scale: [0, utils.random(1, 2)],
      translateX: () => utils.random(-20, 20),
      translateY: () => utils.random(-20, 20),
      rotate: () => utils.random(0, 360),
      duration: 800,
      delay: stagger(80, { from: 'random' })
    }, '-=600');
    
    // Animate text lines
    logoTimeline.add($logoLines, {
      opacity: [0, 1],
      scaleX: [0, 1],
      duration: 600,
      delay: stagger(100)
    }, '-=400');
    
    // Color animations
    logoTimeline.add('.logo-primary', {
      background: primaryColor,
      duration: 800
    }, '-=800');
    
    logoTimeline.add('.logo-accent', {
      background: accentColor,
      duration: 600
    }, '-=600');
    
    // Create continuous particle animation
    createSimpleLoop($logoParticles, {
      rotate: [0, 360],
      scale: [1, 1.5, 1],
      opacity: [0.5, 1, 0.5],
      translateX: utils.random(-10, 10),
      translateY: utils.random(-10, 10)
    }, 4000);
    
    // Animate variants with breathing effect
    logoTimeline.add($logoVariants, {
      opacity: [0, 1],
      scale: [0.5, 1],
      rotateY: [-90, 0],
      duration: 600,
      delay: stagger(100, { from: 'last' })
    }, '-=200');
    
    // Add continuous breathing to main shapes
    createSimpleLoop($logoShapes, {
      scale: [1, 1.05, 1],
      filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)']
    }, 3000);
    
  } catch (error) {
    logError(error, 'animateLogoDesign');
  }
}

// Mobile animation with interactive elements
function animateMobileDesign(primaryColor, accentColor) {
  try {
    const $mobileElements = utils.$('.mobile-header, .mobile-card, .mobile-tab, .hero-image');
    
    const mobileTimeline = safeTimeline({
      defaults: { ease: 'outBack(1.7)' }
    });
    
    mobileTimeline.add('.mobile-frame', {
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateY: [-15, 0],
      duration: 800
    });
    
    mobileTimeline.add($mobileElements, {
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.9, 1],
      duration: 500,
      delay: stagger(100, { ease: 'outQuart' })
    }, '-=400');
    
    mobileTimeline.add('.mobile-nav-bar', {
      background: primaryColor,
      scaleX: [0, 1],
      duration: 600
    }, '-=300');
    
    mobileTimeline.add('.mobile-tab', {
      background: accentColor,
      scale: [0.8, 1],
      duration: 400,
      delay: stagger(80)
    }, '-=200');
    
    // Add floating animation to cards
    createSimpleLoop(utils.$('.mobile-card'), {
      translateY: [0, -5, 0],
      boxShadow: ['0 5px 15px rgba(0,0,0,0.1)', '0 8px 25px rgba(0,0,0,0.2)', '0 5px 15px rgba(0,0,0,0.1)']
    }, 3000);
    
  } catch (error) {
    logError(error, 'animateMobileDesign');
  }
}

// Animation functions for other design types
function animatePosterDesign(primaryColor, accentColor) {
  try {
    const $posterElements = utils.$('.poster-header, .poster-image, .poster-title, .poster-subtitle');
    
    safeTimeline({
      defaults: { ease: 'outExpo' }
    })
    .add('.poster-frame', {
      opacity: [0, 1],
      scale: [0.9, 1],
      rotateX: [-10, 0],
      duration: 800
    })
    .add($posterElements, {
      opacity: [0, 1],
      scale: [0.8, 1],
      translateY: [30, 0],
      duration: 600,
      delay: stagger(120)
    }, '-=400')
    .add('.poster-header', {
      background: primaryColor,
      duration: 600
    }, '-=400')
    .add('.poster-image', {
      background: accentColor,
      duration: 600
    }, '-=300');
  } catch (error) {
    logError(error, 'animatePosterDesign');
  }
  }

function animateBusinessCardDesign(primaryColor, accentColor) {
  try {
    safeTimeline({
      defaults: { ease: 'outBack(1.7)' }
    })
    .add('.card-front', {
      opacity: [0, 1],
      rotateY: [-90, 0],
      duration: 800
    })
    .add('.card-back', {
      opacity: [0, 1],
      rotateY: [90, 0],
      duration: 800
    }, '-=600')
    .add('.card-logo', {
      background: primaryColor,
      scale: [0, 1.2, 1],
      rotate: [0, 15, 0],
      duration: 600
    }, '-=400')
    .add('.pattern-dot', {
      opacity: [0, 1],
      scale: [0, 1],
      background: accentColor,
      duration: 300,
      delay: stagger(50, { from: 'random' })
    }, '-=200');
  } catch (error) {
    logError(error, 'animateBusinessCardDesign');
  }
}

function animateBookDesign(primaryColor, accentColor) {
  try {
    safeTimeline({
      defaults: { ease: 'outExpo' }
    })
    .add('.book-cover', {
      opacity: [0, 1],
      rotateY: [-45, 0],
      scale: [0.8, 1],
      duration: 1000
    })
    .add('.book-title', {
      background: primaryColor,
      scale: [0.5, 1],
      duration: 600
    }, '-=500')
    .add('.book-image', {
      background: accentColor,
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 600
    }, '-=300');
  } catch (error) {
    logError(error, 'animateBookDesign');
  }
}

function animateSocialDesign(primaryColor, accentColor) {
  try {
    const $socialElements = utils.$('.social-header, .social-image, .social-actions, .social-caption');
    
    safeTimeline({
      defaults: { ease: 'outQuart' }
    })
    .add('.social-post', {
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [30, 0],
      duration: 600
    })
    .add($socialElements, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      delay: stagger(120)
    }, '-=300')
    .add('.social-image', {
      background: primaryColor,
      duration: 600
    }, '-=300')
    .add('.social-button', {
      background: accentColor,
      scale: [0, 1.1, 1],
      duration: 400,
      delay: stagger(80)
    }, '-=200');
  } catch (error) {
    logError(error, 'animateSocialDesign');
  }
}

function animateWebsiteDesign(primaryColor, accentColor) {
  try {
    const $elements = utils.$('.mockup-element');
    
    safeTimeline({
      defaults: { ease: 'outExpo' }
    })
    .add($elements, {
      opacity: [0, 1],
      translateX: [-30, 0],
      scale: [0.95, 1],
      duration: 600,
      delay: stagger(100)
    })
    .add('.header-element', {
      background: primaryColor,
      duration: 600
    }, '-=300')
    .add('.cta-element', {
      background: accentColor,
      duration: 400
    }, '-=200');
  } catch (error) {
    logError(error, 'animateWebsiteDesign');
  }
}

// Type-specific animations dispatcher
function animateSpecificDesign(designConfig) {
  try {
    const { mockupType, primaryColor, secondaryColor, accentColor } = designConfig;
    
    switch (mockupType) {
      case 'logo':
        animateLogoDesign(primaryColor, accentColor);
        break;
      case 'mobile':
        animateMobileDesign(primaryColor, accentColor);
        break;
      case 'poster':
        animatePosterDesign(primaryColor, accentColor);
        break;
      case 'business-card':
        animateBusinessCardDesign(primaryColor, accentColor);
        break;
      case 'book':
        animateBookDesign(primaryColor, accentColor);
        break;
      case 'social':
        animateSocialDesign(primaryColor, accentColor);
        break;
      default:
        animateWebsiteDesign(primaryColor, accentColor);
    }
  } catch (error) {
    logError(error, `animateSpecificDesign: ${designConfig.mockupType}`);
  }
}

// Demo loop with transitions
function startDemoLoop() {
  try {
    const runPrompt = () => {
      try {
        // Stop if auto demo is disabled
        if (!isAutoDemo) return;
        
        const prompt = demoPrompts[currentPromptIndex];
        const $typedText = utils.$('#typed-text')[0];
        
        if (!$typedText) {
          demoTimeout = setTimeout(runPrompt, 3000);
          return;
        }
        
        // Update the design info display
        updateDesignInfo();
        
        if ($typedText.textContent) {
          clearText(() => {
            setTimeout(() => {
              if (!isAutoDemo) return; // Check again after delay
              typeText(prompt.text, () => {
                setTimeout(() => {
                  if (!isAutoDemo) return; // Check again after delay
                  animateDesignChange(prompt.design);
                  
                  // Schedule next prompt with index increment
                  demoTimeout = setTimeout(() => {
                    if (!isAutoDemo) return;
                    currentPromptIndex = (currentPromptIndex + 1) % demoPrompts.length;
                    runPrompt();
                  }, 6000);
                }, 1000);
              });
            }, 500);
          });
        } else {
          typeText(prompt.text, () => {
            setTimeout(() => {
              if (!isAutoDemo) return; // Check again after delay
              animateDesignChange(prompt.design);
              
              // Schedule next prompt with index increment
              demoTimeout = setTimeout(() => {
                if (!isAutoDemo) return;
                currentPromptIndex = (currentPromptIndex + 1) % demoPrompts.length;
                runPrompt();
              }, 6000);
            }, 1000);
          });
        }
      } catch (error) {
        logError(error, 'runPrompt');
        if (isAutoDemo) {
          demoTimeout = setTimeout(runPrompt, 3000);
        }
      }
    };
    
    demoLoop = runPrompt;
    runPrompt();
  } catch (error) {
    logError(error, 'startDemoLoop');
  }
}

// Cursor blink animation
function setupCursorBlink() {
  try {
    const $cursor = utils.$('#cursor')[0];
    if (!$cursor) return;

    // Simple blinking cursor animation
    safeAnimate($cursor, {
      opacity: [1, 0],
      duration: 1000,
      ease: 'inOutQuad',
      direction: 'alternate',
      loop: true
    });
  } catch (error) {
    logError(error, 'setupCursorBlink');
  }
}

// Simple button animations
function setupButtonAnimations() {
  try {
    const $buttons = utils.$('.btn');
    
    $buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        safeAnimate(button, {
          scale: 1.05,
          translateY: -2,
          duration: 200,
          ease: 'outQuart'
        });
      });
      
      button.addEventListener('mouseleave', () => {
        safeAnimate(button, {
          scale: 1,
          translateY: 0,
          duration: 200,
          ease: 'outQuart'
        });
      });
    });
  } catch (error) {
    logError(error, 'setupButtonAnimations');
  }
}

// Cleanup
function cleanup() {
  try {
    if (typingTimer) clearTimeout(typingTimer);
    if (demoTimeout) clearTimeout(demoTimeout);
    if (initialLoadTimeout) clearTimeout(initialLoadTimeout);
    if (demoLoop) demoLoop = null;
    continuousAnimations.forEach(anim => {
      if (anim.pause) anim.pause();
    });
    continuousAnimations = [];
  } catch (error) {
    logError(error, 'cleanup');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    init();
    setupCursorBlink();
    setupButtonAnimations();
  } catch (error) {
    logError(error, 'DOMContentLoaded');
  }
});

window.addEventListener('beforeunload', cleanup);

// Global error handler
window.addEventListener('error', (event) => {
  logError(event.error, 'Global error');
}); 