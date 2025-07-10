# Actualize Landing Page - Error Debugging

## 🐛 How to Check for Errors

If something goes wrong with the landing page, you can easily get error information:

### Method 1: Console (Recommended)
1. Open browser developer tools (`F12` or right-click → Inspect)
2. Go to the **Console** tab
3. Look for red error messages with `🚨 Actualize Error:`
4. Copy the error details

### Method 2: JavaScript Command
1. Open browser developer tools (`F12`)
2. Go to the **Console** tab  
3. Type: `window.getActualizeErrors()`
4. Press Enter
5. Copy the formatted JSON output

### Method 3: Direct Access
1. In the console, type: `window.actualizeErrors`
2. This shows the raw error array

## 📋 What Error Info Includes

Each error contains:
- **error**: The error message
- **stack**: Full error stack trace
- **context**: What function/action caused the error
- **timestamp**: When the error occurred
- **promptIndex**: Which demo prompt was active
- **isTyping**: Whether the typewriter was active
- **errorCount**: Total number of errors

## 🎯 Common Issues

1. **Animation Errors**: Usually related to missing elements
2. **Typewriter Errors**: Text animation issues
3. **Mockup Errors**: Problems creating design mockups
4. **Cursor Tracking**: Mouse interaction issues

## 🔧 Copy-Paste Ready

If you encounter errors, just run `window.getActualizeErrors()` in the console and copy the entire output to share with developers.

---

**Current Features:**
- ✅ 7 different design types (logo, mobile, website, poster, business card, book, social)
- ✅ Responsive mockups that transform based on prompt
- ✅ Comprehensive error logging and recovery
- ✅ Safe animation wrappers to prevent crashes
- ✅ Creative prompts beyond just websites 