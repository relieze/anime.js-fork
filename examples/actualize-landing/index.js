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
    
    // Start immediately instead of waiting 2 seconds
    // This prevents the jarring delay and visual glitches
    setTimeout(() => {
      if (isAutoDemo && !hasManuallyNavigated) {
        startDemoLoop();
      } else if (!hasManuallyNavigated) {
        // Show first design immediately
        navigateToDesign(0, true);
      }
    }, 800); // Reduced from 2000ms to 800ms
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

function createWebsiteMockupHTML(designConfig) {
  const { primaryColor, accentColor } = designConfig;
  return `
    <div class="mockup-browser">
      <div class="browser-header">
        <div class="browser-dot dot-red"></div>
        <div class="browser-dot dot-yellow"></div>
        <div class="browser-dot dot-green"></div>
      </div>
      <div class="browser-content">
        <div class="website-hero mockup-element" style="background: ${primaryColor};">
          <div class="website-hero-title"></div>
          <div class="website-hero-subtitle"></div>
          <div class="website-hero-cta" style="background: ${accentColor};"></div>
        </div>
        <div class="website-features">
          <div class="feature-card mockup-element">
            <div class="feature-icon" style="background: ${accentColor};"></div>
            <div class="feature-title"></div>
          </div>
          <div class="feature-card mockup-element">
            <div class="feature-icon" style="background: ${accentColor};"></div>
            <div class="feature-title"></div>
          </div>
          <div class="feature-card mockup-element">
            <div class="feature-icon" style="background: ${accentColor};"></div>
            <div class="feature-title"></div>
          </div>
        </div>
        <div class="website-footer mockup-element"></div>
      </div>
    </div>
  `;
}

function createMockupHTML(designType) {
  const mockups = {
    logo: `
      <div class="mockup-logo">
        <div class="logo-container">
          <div class="logo-main">
            <div class="logo-shape logo-primary"></div>
            <div class="logo-shape logo-secondary"></div>
            <div class="logo-shape logo-accent"></div>
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
    poster: `
      <div class="mockup-poster">
        <div class="poster-frame">
          <div class="poster-pattern"></div>
          <div class="poster-hero">
            <div class="music-icon">
              <svg viewBox="0 0 32 32" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#fff3"/>
                <path d="M22 8v11.5a3.5 3.5 0 1 1-2-3.15V12h-6v7.5a3.5 3.5 0 1 1-2-3.15V10a2 2 0 0 1 2-2h8z" fill="#f39c12"/>
              </svg>
            </div>
          </div>
          <div class="poster-content">
            <div class="poster-headline bold-headline">
              <div class="headline-main"></div>
              <div class="headline-accent"></div>
            </div>
            <div class="poster-event-info">
              <div class="event-date"></div>
              <div class="event-venue"></div>
            </div>
            <div class="poster-details">
              <div class="detail-item detail-1"></div>
              <div class="detail-item detail-2"></div>
            </div>
            <div class="poster-cta">
              <div class="cta-button bold-cta"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    'business-card': `
      <div class="mockup-business-card">
        <div class="card-front dark-card">
          <div class="card-logo-mark large-logo">
            <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#fff2"/>
              <path d="M13 27v-9a7 7 0 0 1 14 0v9" stroke="#f39c12" stroke-width="2.5" fill="none"/>
              <circle cx="20" cy="20" r="4" fill="#f39c12"/>
            </svg>
          </div>
          <div class="card-accent-shape front-accent"></div>
        </div>
        <div class="card-back dark-card">
          <div class="card-accent-shape back-accent"></div>
          <div class="contact-placeholders" style="margin-bottom: 1.2rem;">
            <div class="contact-placeholder contact-1"></div>
            <div class="contact-placeholder contact-2"></div>
            <div class="contact-placeholder contact-3"></div>
          </div>
          <div class="card-logo-mark small-logo">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#fff2"/>
              <path d="M10 22v-8a6 6 0 0 1 12 0v8" stroke="#f39c12" stroke-width="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="#f39c12"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    book: `
      <div class="mockup-book" style="display: flex; align-items: center; justify-content: center; min-height: 320px;">
        <div style="display: flex; align-items: center;">
          <!-- Spine -->
          <div class="book-spine-minimal" style="width: 18px; height: 240px; border-radius: 10px 0 0 10px; background: linear-gradient(180deg, #6366f1 0%, #a5b4fc 100%); margin-right: -8px; box-shadow: 6px 0 18px 0 rgba(99,102,241,0.22), 0 0 0 2px #fff4, 8px 0 18px -4px #0002; position: relative;">
            <!-- Stronger highlight -->
            <div style="position: absolute; left: 3px; top: 20px; width: 4px; height: 70px; border-radius: 2px; background: linear-gradient(180deg, #fff9, #6366f1 80%); opacity: 0.85;"></div>
            <!-- Subtle right edge shadow -->
            <div style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; border-radius: 0 8px 8px 0; background: linear-gradient(90deg, transparent 60%, #0002 100%); opacity: 0.7;"></div>
            <!-- Faint shadow cast onto cover -->
            <div style="position: absolute; right: -6px; top: 0; width: 12px; height: 100%; border-radius: 0 10px 10px 0; background: linear-gradient(90deg, #6366f1 0%, transparent 100%); opacity: 0.08;"></div>
          </div>
          <!-- Cover -->
          <div class="book-cover-minimal" style="width: 170px; height: 240px; border-radius: 10px; background: radial-gradient(ellipse at 60% 30%, #e0f2fe 60%, #fafdff 100%), linear-gradient(135deg, #fafdff 60%, #eaf1fa 100%); box-shadow: 0 12px 40px rgba(0,0,0,0.22), 0 0 0 8px #fff1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <!-- Glow/vignette -->
            <div style="position: absolute; inset: 0; border-radius: 10px; background: radial-gradient(circle at 50% 60%, #38bdf8 0%, transparent 70%); opacity: 0.18;"></div>
            <!-- Sci-fi art block -->
            <div style="position: absolute; top: 70px; left: 50%; transform: translateX(-50%); width: 100px; height: 68px; border-radius: 16px; background: linear-gradient(135deg, #22d3ee 0%, #6366f1 100%); box-shadow: 0 4px 24px #38bdf855;"></div>
            <!-- Planets / stars -->
            <div style="position: absolute; top: 38px; left: 44px; width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #a5b4fc 60%, #38bdf8 100%); opacity: 0.85;"></div>
            <div style="position: absolute; top: 130px; left: 120px; width: 12px; height: 12px; border-radius: 50%; background: #bae6fd; opacity: 0.8;"></div>
            <div style="position: absolute; top: 180px; left: 80px; width: 8px; height: 8px; border-radius: 50%; background: #f0abfc; opacity: 0.7;"></div>
            <div style="position: absolute; top: 100px; left: 30px; width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0.7;"></div>
            <div style="position: absolute; top: 60px; left: 110px; width: 7px; height: 7px; border-radius: 50%; background: #f472b6; opacity: 0.7;"></div>
            <!-- Additional planets/stars -->
            <div style="position: absolute; top: 50px; left: 120px; width: 10px; height: 10px; border-radius: 50%; background: #fef9c3; opacity: 0.7;"></div>
            <div style="position: absolute; top: 200px; left: 40px; width: 5px; height: 5px; border-radius: 50%; background: #a7f3d0; opacity: 0.7;"></div>
            <!-- More visible orbital arc -->
            <svg style="position: absolute; top: 120px; left: 30px;" width="110" height="40"><ellipse cx="55" cy="20" rx="50" ry="16" fill="none" stroke="#bae6fd" stroke-width="2.2" opacity="0.38"/></svg>
            <!-- Beam / rocket trail -->
            <div style="position: absolute; top: 60px; left: 50%; transform: translateX(-50%); width: 3px; height: 38px; border-radius: 2px; background: linear-gradient(180deg, #fff 60%, #38bdf8 100%); box-shadow: 0 0 8px #fff8; opacity: 0.8;"></div>
            <!-- Minimal rocket silhouette -->
            <svg style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);" width="22" height="38" viewBox="0 0 22 38"><polygon points="11,0 21,30 1,30" fill="#6366f1" opacity="0.92"/><rect x="8.5" y="30" width="5" height="7" rx="2.5" fill="#38bdf8" opacity="0.85"/></svg>
            <!-- Foreground blocky structure silhouette (more visible) -->
            <svg style="position: absolute; bottom: 0; left: 0;" width="170" height="32"><rect x="0" y="18" width="40" height="14" fill="#a5b4fc" opacity="0.38"/><rect x="50" y="24" width="24" height="8" fill="#6366f1" opacity="0.28"/><rect x="90" y="20" width="30" height="12" fill="#38bdf8" opacity="0.22"/></svg>
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
              <div class="avatar-img"></div>
            </div>
            <div class="social-user-bar"></div>
          </div>
          <div class="social-image-area">
            <svg class="social-image-svg" viewBox="0 0 160 120" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
              <defs>
                <linearGradient id="bgGrad" x1="0" y1="0" x2="160" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#ffe2c0"/>
                  <stop offset="1" stop-color="#fecbb0"/>
                </linearGradient>
                <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stop-color="#f9d0b4"/>
                  <stop offset="100%" stop-color="#f7bfa2"/>
                </radialGradient>
                <linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#f7c7a3"/>
                  <stop offset="1" stop-color="#eeb38a"/>
                </linearGradient>
                <linearGradient id="torsoGrad" x1="0" y1="0" x2="160" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#f7c7a3"/>
                  <stop offset="1" stop-color="#eeb38a"/>
                </linearGradient>
              </defs>
              <!-- BG -->
              <rect x="0" y="0" width="160" height="120" rx="18" fill="url(#bgGrad)"/>
              <!-- Torso/shoulders: wide ellipse for rounded shoulders -->
              <ellipse cx="80" cy="98" rx="44" ry="18" fill="url(#torsoGrad)"/>
              <!-- V-neck/collar (optional, subtle) -->
              <polygon points="80,98 87,110 73,110" fill="#fff" opacity="0.13"/>
              <!-- Neck: small vertical rounded rect -->
              <rect x="70" y="74" width="20" height="18" rx="7" fill="url(#neckGrad)"/>
              <!-- Head: large circle -->
              <ellipse cx="80" cy="62" rx="22" ry="22" fill="url(#faceGrad)"/>
            </svg>
            <div class="social-image-overlay"></div>
          </div>
          <div class="social-actions">
            <div class="social-action social-like" title="Like">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17s-5-3.33-5-7.5A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 5 3.5C15 13.67 10 17 10 17z" stroke="#ff6b6b" stroke-width="1.5" fill="#ff6b6b22"/></svg>
            </div>
            <div class="social-action social-comment" title="Comment">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 15v-1a7 7 0 1 1 3.5 2.5L4 17z" stroke="#34495e" stroke-width="1.5" fill="#34495e22"/></svg>
            </div>
            <div class="social-action social-share" title="Share">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 8.5V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.5M10 10l5-5m0 0l-5-5m5 5H5" stroke="#4facfe" stroke-width="1.5" fill="#4facfe22"/></svg>
            </div>
          </div>
          <div class="social-caption-bar"></div>
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
    
    // Use the new function for website
    if (designConfig.mockupType === 'website') {
      $designMockup.innerHTML = createWebsiteMockupHTML(designConfig);
    } else {
      $designMockup.innerHTML = createMockupHTML(designConfig.mockupType);
    }
    
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
    
    if (designConfig.mockupType === 'book') {
      setBookCoverInitialStates();
    }
    
    setTimeout(() => {
      animateSpecificDesign(designConfig);
    }, 600);
    
  } catch (error) {
    logError(error, 'animateDesignChange');
  }
}

// Minimal logo preview animation - shows AI understands logo concepts
function animateLogoDesign(primaryColor, accentColor) {
  try {
    const $logoShapes = utils.$('.logo-shape');
    const $logoLines = utils.$('.logo-line');
    const $logoVariants = utils.$('.logo-variant');
    
    if (!$logoShapes.length) return;
    
    // Clean, minimal entrance that says "I understand logo design"
    const logoTimeline = safeTimeline({
      defaults: { ease: 'outExpo' }
    });
    
    // Logo shapes appear with professional confidence
    logoTimeline.add($logoShapes, {
      opacity: [0, 1],
      scale: [0.8, 1],
      translateY: [20, 0],
      duration: 600,
      delay: stagger(100)
    });
    
    // Apply colors to show AI understands brand identity
    logoTimeline.add('.logo-primary', {
      background: primaryColor,
      duration: 400
    }, '-=400');
    
    logoTimeline.add('.logo-accent', {
      background: accentColor,
      duration: 400
    }, '-=200');
    
    // Text elements appear to show typography understanding
    if ($logoLines.length > 0) {
      logoTimeline.add($logoLines, {
        opacity: [0, 1],
        scaleX: [0, 1],
        transformOrigin: 'left center',
        duration: 500,
        delay: stagger(80)
      }, '-=200');
    }
    
    // Variants show the AI can create logo variations  
    if ($logoVariants.length > 0) {
      logoTimeline.add($logoVariants, {
        opacity: [0, 1],
        scale: [0.7, 1],
        duration: 400,
        delay: stagger(100)
      }, '-=100');
    }
    
    // Subtle continuous animation - professional, not distracting
    setTimeout(() => {
      // Very gentle breathing for main logo
      safeAnimate($logoShapes, {
        scale: [1, 1.02, 1],
        duration: 3000,
        ease: 'inOutSine',
        loop: true
      });
      
    }, 800);
    
  } catch (error) {
    logError(error, 'animateLogoDesign');
  }
}

// Mobile animation with interactive elements
function animateMobileDesign(primaryColor, accentColor) {
  try {
    // Phone frame is already animated by animateDesignChange - only animate internal elements
    const mobileTimeline = safeTimeline({
      defaults: { ease: 'outQuart' }
    });
    
    // 1. Pink navigation bar (child of mobile-header)
    mobileTimeline.add('.mobile-nav-bar', {
      opacity: [0, 1],
      scaleX: [0, 1],
      duration: 400
    });
    
    // 2. Status bar area (separate from nav bar to avoid conflict)
    mobileTimeline.add('.mobile-status-bar', {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300
    }, '-=150');
    
    // 3. Hero section (image + text together)
    mobileTimeline.add('.mobile-hero', {
      opacity: [0, 1],
      translateY: [15, 0],
      scale: [0.95, 1],
      duration: 400
    }, '-=100');
    
    // 4. Content cards (animated as group, no individual conflicts)
    mobileTimeline.add('.mobile-card', {
      opacity: [0, 1],
      translateY: [15, 0],
      scale: [0.95, 1],
      duration: 350,
      delay: stagger(80) // Stagger only the cards
    }, '-=50');
    
    // 5. Bottom tabs - ONLY background color, no scale/opacity conflicts
    mobileTimeline.add('.mobile-tab', {
      background: accentColor,
      duration: 300,
      delay: stagger(60)
    }, '-=100');
    
    // 6. Delayed floating animation - wait for all entrance to complete
    setTimeout(() => {
      createSimpleLoop(utils.$('.mobile-card'), {
        translateY: [0, -3, 0],
        duration: 4000
      });
    }, 1200); // Longer delay to ensure no conflicts
    
  } catch (error) {
    logError(error, 'animateMobileDesign');
  }
}

// Animation functions for other design types
function animatePosterDesign(primaryColor, accentColor) {
  try {
    safeTimeline({
      defaults: { ease: 'outExpo' }
    })
    .add('.poster-pattern', {
      opacity: [0, 0.18],
      duration: 600
    })
    .add('.poster-frame', {
      opacity: [0, 1],
      scale: [0.9, 1],
      rotateX: [-10, 0],
      duration: 800
    }, '-=400')
    .add('.music-icon', {
      opacity: [0, 1],
      scale: [0.5, 1.2, 1],
      duration: 700
    }, '-=500')
    .add('.poster-hero', {
      opacity: [0, 1],
      scale: [0.8, 1],
      translateY: [20, 0],
      duration: 700
    }, '-=600')
    .add('.headline-main', {
      opacity: [0, 1],
      scale: [0.7, 1.1, 1],
      translateX: [-20, 0],
      duration: 600
    }, '-=300')
    .add('.headline-accent', {
      opacity: [0, 1],
      scale: [0.7, 1.1, 1],
      translateX: [20, 0],
      duration: 500
    }, '-=200')
    .add('.event-date, .event-venue', {
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [15, 0],
      duration: 500,
      delay: stagger(100)
    }, '-=200')
    .add('.detail-item', {
      opacity: [0, 1],
      scale: [0.8, 1],
      translateX: [10, 0],
      duration: 400,
      delay: stagger(80)
    }, '-=100')
    .add('.cta-button', {
      opacity: [0, 1],
      scale: [0, 1.2, 1],
      duration: 500
    }, '-=100');
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
    .add('.card-logo-mark.large-logo', {
      opacity: [0, 1],
      scale: [0.5, 1.1, 1],
      duration: 500
    }, '-=600')
    .add('.card-accent-shape.front-accent', {
      opacity: [0, 0.7],
      scale: [0.8, 1],
      duration: 400
    }, '-=350')
    .add('.card-back', {
      opacity: [0, 1],
      rotateY: [90, 0],
      duration: 800
    }, '-=600')
    .add('.card-accent-shape.back-accent', {
      opacity: [0, 0.7],
      scale: [0.8, 1],
      duration: 400
    }, '-=600')
    .add('.card-logo-mark.small-logo', {
      opacity: [0, 1],
      scale: [0.5, 1.1, 1],
      duration: 500
    }, '-=400')
    .add('.contact-placeholder', {
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: 300,
      delay: stagger(80)
    }, '-=300');
  } catch (error) {
    logError(error, 'animateBusinessCardDesign');
  }
}

// --- Book Cover Minimal Animation Utilities ---
/**
 * Sets all Book Cover features to their hidden/initial state for animation.
 * Ensures no double fade or stutter when animating in.
 */
function setBookCoverInitialStates() {
  const $spine = utils.$('.book-spine-minimal')[0];
  const $cover = utils.$('.book-cover-minimal')[0];
  if (!$spine || !$cover) return;
  // Hide spine
  utils.set($spine, { opacity: 0, translateX: -30 });
  // Hide cover
  utils.set($cover, { opacity: 0, scale: 0.92 });
  // Children
  const $children = Array.from($cover.children);
  const $glow = $children[0];
  const $artBlock = $children[1];
  const $planets = $children.slice(2, 8);
  const $orbit = $children[8];
  const $beam = $children[9];
  const $rocket = $children[10];
  const $structure = $children[11];
  // Glow
  if ($glow) utils.set($glow, { opacity: 0 });
  // Art block
  if ($artBlock) utils.set($artBlock, { opacity: 0, scale: 0.8 });
  // Planets
  $planets.forEach(p => utils.set(p, { opacity: 0, scale: 0.7 }));
  // Orbit
  if ($orbit && $orbit.tagName === 'svg') {
    const $ellipse = $orbit.querySelector('ellipse');
    if ($ellipse) {
      $ellipse.style.opacity = 0;
      $ellipse.style.strokeDasharray = $ellipse.getTotalLength ? $ellipse.getTotalLength() : 200;
      $ellipse.style.strokeDashoffset = $ellipse.style.strokeDasharray;
    }
  }
  // Beam
  if ($beam) utils.set($beam, { opacity: 0, scaleY: 0.2 });
  // Rocket
  if ($rocket && $rocket.tagName === 'svg') utils.set($rocket, { opacity: 0, translateY: 30, scale: 0.7 });
  // Structure
  if ($structure && $structure.tagName === 'svg') utils.set($structure, { opacity: 0, translateY: 20 });
}

/**
 * Animates the minimal sci-fi Book Cover preview.
 * Targets dynamically generated elements in the .mockup-book/.book-cover-minimal structure.
 * Animates: spine, cover, art block, planets, orbit, beam, rocket, and blocky structure in a staggered, elegant sequence.
 */
function animateBookDesignMinimal() {
  try {
    const $spine = utils.$('.book-spine-minimal')[0];
    const $cover = utils.$('.book-cover-minimal')[0];
    if (!$spine || !$cover) return;
    // Find children by order and style (since no unique classes)
    const $children = Array.from($cover.children);
    const $glow = $children[0];
    const $artBlock = $children[1];
    const $planets = $children.slice(2, 8);
    const $orbit = $children[8]; // SVG
    const $beam = $children[9];
    const $rocket = $children[10]; // SVG
    const $structure = $children[11]; // SVG
    // Timeline for entrance sequence
    const tl = safeTimeline({ defaults: { ease: 'outExpo' } });
    // 1. Spine: slide/fade in from left
    tl.add($spine, {
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 500
    });
    // 2. Cover: fade/scale in
    tl.add($cover, {
      opacity: [0, 1],
      scale: [0.92, 1],
      duration: 500
    }, '-=300');
    // 3. Glow: fade in
    if ($glow) tl.add($glow, {
      opacity: [0, 0.18],
      duration: 400
    }, '-=250');
    // 4. Art block: pop/scale in
    if ($artBlock) tl.add($artBlock, {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 400
    }, '-=200');
    // 5. Planets/stars: staggered fade/scale in
    if ($planets.length) tl.add($planets, {
      opacity: [0, 1],
      scale: [0.7, 1],
      duration: 350,
      delay: stagger(80)
    }, '-=200');
    // 6. Orbit: draw/fade in
    if ($orbit && $orbit.tagName === 'svg') {
      const $ellipse = $orbit.querySelector('ellipse');
      if ($ellipse) {
        const len = $ellipse.getTotalLength ? $ellipse.getTotalLength() : 200;
        $ellipse.style.strokeDasharray = len;
        $ellipse.style.strokeDashoffset = len;
        safeAnimate($ellipse, {
          strokeDashoffset: [len, 0],
          opacity: [0, 0.38],
          duration: 500
        });
      }
    }
    // 7. Beam: grow/fade in (height/opacity)
    if ($beam) {
      $beam.style.transform += ' scaleY(0.2)';
      safeAnimate($beam, {
        opacity: [0, 0.8],
        scaleY: [0.2, 1],
        duration: 350
      });
    }
    // 8. Rocket: slide/scale in from bottom
    if ($rocket && $rocket.tagName === 'svg') {
      safeAnimate($rocket, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.7, 1],
        duration: 400
      });
    }
    // 9. Blocky structure: slide/fade in from bottom
    if ($structure && $structure.tagName === 'svg') {
      safeAnimate($structure, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400
      });
    }
    // Optional: gentle floating for planets after entrance
    setTimeout(() => {
      createSimpleLoop($planets, {
        translateY: [0, -3, 0],
        duration: 4000
      });
    }, 1200);
  } catch (error) {
    logError(error, 'animateBookDesignMinimal');
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
    const $avatar = utils.$('.social-avatar')[0];
    const $userBar = utils.$('.social-user-bar')[0];
    const $imageArea = utils.$('.social-image-area')[0];
    const $actions = utils.$('.social-actions')[0];
    const $actionBtns = utils.$('.social-action');
    const $captionBar = utils.$('.social-caption-bar')[0];
    const $card = utils.$('.social-post')[0];

    // Set initial states for all features (hidden)
    if ($avatar) utils.set($avatar, { opacity: 0, translateY: 20 });
    if ($userBar) utils.set($userBar, { opacity: 0, translateY: 20 });
    if ($imageArea) utils.set($imageArea, { opacity: 0, scale: 0.95 });
    if ($actions) utils.set($actions, { opacity: 1 }); // container always visible
    if ($actionBtns.length) Array.from($actionBtns).forEach(btn => utils.set(btn, { opacity: 0, scale: 0.7 }));
    if ($captionBar) utils.set($captionBar, { opacity: 0, translateY: 10 });

    // Card entrance (features hidden)
    if ($card) utils.set($card, { opacity: 0, scale: 0.9, translateY: 30 });
    const timeline = safeTimeline({ defaults: { ease: 'outQuart' } });
    timeline.add($card, {
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [30, 0],
      duration: 600
    });

    // Avatar and user bar
    if ($avatar && $userBar) {
      timeline.add([$avatar, $userBar], {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        delay: stagger(80)
      }, '-=300');
    }

    // Media area (SVG selfie)
    if ($imageArea) {
      timeline.add($imageArea, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 500
      }, '-=200');
    }

    // Actions (staggered pop)
    if ($actions && $actionBtns.length) {
      timeline.add($actionBtns, {
        opacity: [0, 1],
        scale: [0.7, 1.15, 1],
        duration: 350,
        delay: stagger(90)
      }, '-=200');
    }

    // Caption bar
    if ($captionBar) {
      timeline.add($captionBar, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 350
      }, '-=150');
    }

    // Optional: gentle breathing animation for SVG selfie
    setTimeout(() => {
      const $svg = utils.$('.social-image-svg')[0];
      if ($svg) {
        safeAnimate($svg, {
          scale: [1, 1.025, 1],
          duration: 3400,
          ease: 'inOutSine',
          loop: true
        });
      }
    }, 900);
  } catch (error) {
    logError(error, 'animateSocialDesign');
  }
}

function animateWebsiteDesign(primaryColor, accentColor) {
  try {
    // Animate hero section
    const websiteTimeline = safeTimeline({
      defaults: { ease: 'outExpo' }
    });
    websiteTimeline
      .add('.website-hero', {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        duration: 600
      })
      .add('.website-hero-title', {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        duration: 400
      }, '-=300')
      .add('.website-hero-subtitle', {
        opacity: [0, 1],
        translateY: [15, 0],
        scale: [0.95, 1],
        duration: 350
      }, '-=250')
      .add('.website-hero-cta', {
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 350
      }, '-=200')
      .add('.feature-card', {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        duration: 400,
        delay: stagger(120)
      }, '-=100')
      .add('.website-footer', {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 300
      }, '-=100');
    // No setTimeout color application needed
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
        animateBookDesignMinimal();
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

// Simplified demo loop with better timing
function startDemoLoop() {
  try {
    const runPrompt = () => {
      try {
        // Stop if auto demo is disabled
        if (!isAutoDemo) return;
        
        const prompt = demoPrompts[currentPromptIndex];
        const $typedText = utils.$('#typed-text')[0];
        
        if (!$typedText) {
          demoTimeout = setTimeout(runPrompt, 1500);
          return;
        }
        
        // Update the design info display
        updateDesignInfo();
        
        // Simplified sequence: clear -> type -> animate -> next
        const runSequence = () => {
        if ($typedText.textContent) {
          clearText(() => {
              if (!isAutoDemo) return;
              typeText(prompt.text, () => {
                if (!isAutoDemo) return;
                setTimeout(() => {
                  animateDesignChange(prompt.design);
                  scheduleNext();
                }, 600); // Reduced from 1000ms
              });
          });
        } else {
          typeText(prompt.text, () => {
              if (!isAutoDemo) return;
            setTimeout(() => {
              animateDesignChange(prompt.design);
                scheduleNext();
              }, 600); // Reduced from 1000ms
            });
          }
        };
              
        const scheduleNext = () => {
          if (!isAutoDemo) return;
              demoTimeout = setTimeout(() => {
                if (!isAutoDemo) return;
                currentPromptIndex = (currentPromptIndex + 1) % demoPrompts.length;
                runPrompt();
          }, 4500); // Reduced from 6000ms
        };
        
        runSequence();
      } catch (error) {
        logError(error, 'runPrompt');
        if (isAutoDemo) {
          demoTimeout = setTimeout(runPrompt, 2000);
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

// Enhanced cleanup to prevent memory leaks
function cleanup() {
  try {
    // Clear all timers
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (demoTimeout) {
      clearTimeout(demoTimeout);
      demoTimeout = null;
    }
    
    // Stop demo loop
    if (demoLoop) demoLoop = null;
    isAutoDemo = false;
    
    // Stop all continuous animations
    continuousAnimations.forEach(anim => {
      try {
        if (anim && typeof anim.pause === 'function') {
          anim.pause();
        }
      } catch (e) {
        // Ignore errors when stopping animations
      }
    });
    continuousAnimations.length = 0; // Clear array efficiently
    
    // Reset state
    isTyping = false;
    hasManuallyNavigated = false;
    
  } catch (error) {
    logError(error, 'cleanup');
  }
}

// Animated dots for 'Generating design...' status
let genDotsInterval = null;
function startGenDotsAnimation() {
  const dots = ['', '.', '..', '...'];
  let idx = 0;
  const el = document.getElementById('gen-dots');
  if (!el) return;
  if (genDotsInterval) clearInterval(genDotsInterval);
  genDotsInterval = setInterval(() => {
    el.textContent = dots[idx];
    idx = (idx + 1) % dots.length;
  }, 400);
}
function stopGenDotsAnimation() {
  if (genDotsInterval) clearInterval(genDotsInterval);
  genDotsInterval = null;
  const el = document.getElementById('gen-dots');
  if (el) el.textContent = '...';
}
// Start animation on page load (or whenever status is shown)
document.addEventListener('DOMContentLoaded', () => {
  startGenDotsAnimation();
});
// Optionally, you can call startGenDotsAnimation() and stopGenDotsAnimation() when the status indicator is shown/hidden in your app logic.

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    init();
    setupCursorBlink();
    setupButtonAnimations();
    setupResponsiveHandlers();
  } catch (error) {
    logError(error, 'DOMContentLoaded');
  }
});

// Setup responsive and visibility handlers
function setupResponsiveHandlers() {
  try {
    let resizeTimeout;
    
    // Handle window resize - restart animations after resize stops
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        try {
          // Stop current animations
          stopAllAnimations();
          
          // Restart key animations after resize
          setupPageAnimations();
          setupBackgroundAnimations();
          setupCursorBlink();
          
          // If we have a current design, refresh it
          if (!isTyping && currentPromptIndex >= 0) {
            const currentDesign = demoPrompts[currentPromptIndex];
            if (currentDesign) {
              setTimeout(() => {
                animateDesignChange(currentDesign.design);
              }, 200);
            }
          }
        } catch (error) {
          logError(error, 'resize handler');
        }
      }, 300); // Wait 300ms after resize stops
    });
    
    // Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) {
          // Page is hidden (user switched tabs)
          if (isAutoDemo) {
            // Pause auto demo but don't disable it
            if (demoTimeout) {
              clearTimeout(demoTimeout);
              demoTimeout = null;
            }
          }
        } else {
          // Page is visible again
          if (isAutoDemo && !demoTimeout && !isTyping) {
            // Restart auto demo if it was running
            setTimeout(() => {
              if (isAutoDemo && !hasManuallyNavigated) {
                startDemoLoop();
              }
            }, 500);
          }
        }
      } catch (error) {
        logError(error, 'visibilitychange handler');
      }
    });
    
  } catch (error) {
    logError(error, 'setupResponsiveHandlers');
  }
}

window.addEventListener('beforeunload', cleanup);

// Global error handler
window.addEventListener('error', (event) => {
  logError(event.error, 'Global error');
}); 