import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { pinyin } from "pinyin-pro"
import { Root, Code, Html } from "mdast"

// Tone colors configuration
const TONE_COLORS = {
  1: "#ff6b35", // 1st tone - phoenix flame
  2: "#6edcb8", // 2nd tone - sea foam
  3: "#a78bfa", // 3rd tone - deep amethyst
  4: "#b0b0b0", // 4th tone - soft grey
  5: "#ffd966", // neutral tone - bright citrine
  0: "#ffd966", // fallback for neutral
} as const

interface ZhongwenOptions {
  // Future options can be added here
}

// Helper function to get tone number from pinyin with tone marks
function getToneFromPinyin(pinyinStr: string): number {
  // First tone: ā ē ī ō ū ǖ
  if (/[āēīōūǖ]/.test(pinyinStr)) return 1
  // Second tone: á é í ó ú ǘ
  if (/[áéíóúǘ]/.test(pinyinStr)) return 2
  // Third tone: ǎ ě ǐ ǒ ǔ ǚ
  if (/[ǎěǐǒǔǚ]/.test(pinyinStr)) return 3
  // Fourth tone: à è ì ò ù ǜ
  if (/[àèìòùǜ]/.test(pinyinStr)) return 4
  // Neutral tone (no tone mark)
  return 5
}

// Check if a character is a Chinese character
function isChinese(char: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}]/u.test(
    char,
  )
}

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Process Chinese text and return HTML string with ruby annotations
function processChineseText(text: string): string {
  const chars = Array.from(text)
  let html = ""

  // Extract only Chinese characters for pinyin conversion
  const chineseOnly = chars.filter((c) => isChinese(c)).join("")
  const pinyinArray = pinyin(chineseOnly, { type: "array" })

  let pinyinIndex = 0
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]

    if (isChinese(char)) {
      const charPinyin = pinyinArray[pinyinIndex] || ""
      const tone = getToneFromPinyin(charPinyin)
      const color = TONE_COLORS[tone as keyof typeof TONE_COLORS] || TONE_COLORS[5]

      // Create ruby element with tone coloring
      html += `<ruby class="zhongwen-char" style="--tone-color: ${color}" data-tone="${tone}">`
      html += `<span class="zhongwen-hanzi">${escapeHtml(char)}</span>`
      html += `<rp>(</rp>`
      html += `<rt class="zhongwen-pinyin">${escapeHtml(charPinyin)}</rt>`
      html += `<rp>)</rp>`
      html += `</ruby>`
      pinyinIndex++
    } else if (char === "\n") {
      // Handle line breaks
      html += `<br>`
    } else if (/\s/.test(char)) {
      // Handle whitespace
      html += `<span class="zhongwen-space">${char}</span>`
    } else {
      // Handle punctuation and other characters
      html += `<span class="zhongwen-punct">${escapeHtml(char)}</span>`
    }
  }

  return html
}

export const ZhongwenBlock: QuartzTransformerPlugin<Partial<ZhongwenOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "ZhongwenBlock",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            visit(tree, "code", (node: Code, index, parent) => {
              // Check if this is a zh-cn code block
              if (node.lang === "zh-cn" && parent && typeof index === "number") {
                const textContent = node.value.trim()

                if (textContent) {
                  const processedHtml = processChineseText(textContent)

                  // Create the wrapper div with all styling
                  const htmlContent = `<div class="zhongwen-block" data-pinyin="always" data-colors="on">${processedHtml}</div>`

                  // Replace the code node with an HTML node
                  const htmlNode: Html = {
                    type: "html",
                    value: htmlContent,
                  }

                  // Replace the node in the parent's children array
                  parent.children[index] = htmlNode
                }
              }
            })
          }
        },
      ]
    },
  }
}
