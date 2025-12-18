// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme)

  const themeToggle = document.getElementById("themeToggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "light" ? "dark" : "light"
  document.documentElement.setAttribute("data-theme", newTheme)
//   localStorage.setItem("theme", newTheme)
  updateThemeIcon(newTheme)
}

function updateThemeIcon(theme) {
  const icon = document.querySelector(".theme-icon")
  if (icon) {
    icon.textContent = theme === "light" ? "🌙" : "☀️"
  }
}

// Utility Functions
function showMessage(element, message, type) {
  element.textContent = message
  element.className = `message-container show ${type}`

  setTimeout(() => {
    element.classList.remove("show")
  }, 5000)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initTheme()

  // Login Form Handler
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Signup Form Handler
  const signupForm = document.getElementById("signupForm")
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup)
  }
})

// Login Handler
function handleLogin(e) {
  e.preventDefault()

// 
  const email = document.getElementById("loginEmail").value.trim()
  const password = document.getElementById("loginPassword").value.trim()
  const messageEl = document.getElementById("loginMessage")
  // Validation
  if (!email || !password) {
    showMessage(messageEl, "Please fill in all fields", "error")
    return
  }

  if (!isValidEmail(email)) {
    showMessage(messageEl, "Please enter a valid email", "error")
    return
  }

  // Simulate successful login
  showMessage(messageEl, "Login successful! Redirecting...", "success")

  setTimeout(() => {
    const user = { name: email.split("@")[0], email }
  
  }, 5000)
}

// Signup Handler
function handleSignup(e) {
  e.preventDefault()


  // Validation
  if (!name || !email || !password) {
    showMessage(messageEl, "Please fill in all fields", "error")
    return
  }

  if (!isValidEmail(email)) {
    showMessage(messageEl, "Please enter a valid email", "error")
    return
  }

  if (password.length < 6) {
    showMessage(messageEl, "Password must be at least 6 characters", "error")
    return
  }

  // Simulate successful signup
  showMessage(messageEl, "Account created! Redirecting...", "success")

  setTimeout(() => {
    const user = { name, email }
   
   
  }, 5000)
}
