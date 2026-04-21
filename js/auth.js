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
  localStorage.setItem("theme", newTheme)
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
  if (!element) return;
  element.textContent = message
  element.className = `message-container show ${type}`

  setTimeout(() => {
    element.classList.remove("show")
  }, 5000)
}

function setBtnLoading(btn, isLoading, text = "Processing...") {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = text;
  } else {
    btn.disabled = false;
    btn.innerText = btn.dataset.originalText || "Submit";
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initTheme()
})

// Exporting UI utilities for other scripts
export { showMessage, isValidEmail, setBtnLoading };
