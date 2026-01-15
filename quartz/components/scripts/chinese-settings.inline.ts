// Load saved preferences from localStorage
const STORAGE_KEY_PINYIN = "zhongwen-pinyin"
const STORAGE_KEY_COLORS = "zhongwen-colors"
const STORAGE_KEY_CAPITALIZATION = "zhongwen-capitalization"

// Apply saved preferences on page load (defaults: all off for new visitors)
const savedPinyin = localStorage.getItem(STORAGE_KEY_PINYIN) || "hidden"
const savedColors = localStorage.getItem(STORAGE_KEY_COLORS) || "off"
const savedCapitalization = localStorage.getItem(STORAGE_KEY_CAPITALIZATION) || "off"

document.documentElement.setAttribute("data-zhongwen-pinyin", savedPinyin)
document.documentElement.setAttribute("data-zhongwen-colors", savedColors)
document.documentElement.setAttribute("data-zhongwen-capitalization", savedCapitalization)

document.addEventListener("nav", () => {
  const settingsContainer = document.getElementById("chinese-settings")
  if (!settingsContainer) return

  const toggleButton = settingsContainer.querySelector(".chinese-settings-toggle")
  const panel = settingsContainer.querySelector(".chinese-settings-panel")
  const closeButton = settingsContainer.querySelector(".chinese-settings-close")

  if (!toggleButton || !panel || !closeButton) return

  // Update button states to reflect current settings
  const updateButtonStates = () => {
    const currentPinyin = localStorage.getItem(STORAGE_KEY_PINYIN) || "hidden"
    const currentColors = localStorage.getItem(STORAGE_KEY_COLORS) || "off"
    const currentCapitalization = localStorage.getItem(STORAGE_KEY_CAPITALIZATION) || "off"

    // Update pinyin buttons
    const pinyinButtons = panel.querySelector('[data-setting="pinyin"]')
    if (pinyinButtons) {
      pinyinButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentPinyin)
      })
    }

    // Update color buttons
    const colorButtons = panel.querySelector('[data-setting="colors"]')
    if (colorButtons) {
      colorButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentColors)
      })
    }

    // Update capitalization buttons
    const capitalizationButtons = panel.querySelector('[data-setting="capitalization"]')
    if (capitalizationButtons) {
      capitalizationButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentCapitalization)
      })
    }
  }

  // Initialize button states
  updateButtonStates()

  // Toggle panel visibility
  const togglePanel = () => {
    const isOpen = panel.classList.contains("open")
    panel.classList.toggle("open", !isOpen)
    panel.setAttribute("aria-hidden", isOpen ? "true" : "false")
  }

  // Close panel
  const closePanel = () => {
    panel.classList.remove("open")
    panel.setAttribute("aria-hidden", "true")
  }

  // Handle setting changes
  const handleSettingChange = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.tagName !== "BUTTON") return

    const buttonGroup = target.closest(".chinese-settings-buttons")
    if (!buttonGroup) return

    const setting = buttonGroup.getAttribute("data-setting")
    const value = target.getAttribute("data-value")

    if (!setting || !value) return

    // Update active state
    buttonGroup.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn === target)
    })

    // Save to localStorage and apply
    if (setting === "pinyin") {
      localStorage.setItem(STORAGE_KEY_PINYIN, value)
      document.documentElement.setAttribute("data-zhongwen-pinyin", value)
    } else if (setting === "colors") {
      localStorage.setItem(STORAGE_KEY_COLORS, value)
      document.documentElement.setAttribute("data-zhongwen-colors", value)
    } else if (setting === "capitalization") {
      localStorage.setItem(STORAGE_KEY_CAPITALIZATION, value)
      document.documentElement.setAttribute("data-zhongwen-capitalization", value)
    }
  }

  // Close panel when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!settingsContainer.contains(e.target as Node)) {
      closePanel()
    }
  }

  // Event listeners
  toggleButton.addEventListener("click", togglePanel)
  closeButton.addEventListener("click", closePanel)
  panel.addEventListener("click", handleSettingChange)
  document.addEventListener("click", handleClickOutside)

  // Cleanup
  window.addCleanup(() => {
    toggleButton.removeEventListener("click", togglePanel)
    closeButton.removeEventListener("click", closePanel)
    panel.removeEventListener("click", handleSettingChange)
    document.removeEventListener("click", handleClickOutside)
  })
})
