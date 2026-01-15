import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { pinyin } from "pinyin-pro"
import { Root, Element, Text } from "hast"

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

// Process Chinese text and return HAST nodes with ruby annotations
function processChineseText(text: string): Element[] {
  const result: Element[] = []
  const chars = Array.from(text)

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
      const rubyElement: Element = {
        type: "element",
        tagName: "ruby",
        properties: {
          className: ["zhongwen-char"],
          style: `--tone-color: ${color}`,
          "data-tone": tone,
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["zhongwen-hanzi"],
            },
            children: [{ type: "text", value: char }],
          },
          {
            type: "element",
            tagName: "rp",
            properties: {},
            children: [{ type: "text", value: "(" }],
          },
          {
            type: "element",
            tagName: "rt",
            properties: {
              className: ["zhongwen-pinyin"],
            },
            children: [{ type: "text", value: charPinyin }],
          },
          {
            type: "element",
            tagName: "rp",
            properties: {},
            children: [{ type: "text", value: ")" }],
          },
        ],
      }

      result.push(rubyElement)
      pinyinIndex++
    } else if (char === "\n") {
      // Handle line breaks
      result.push({
        type: "element",
        tagName: "br",
        properties: {},
        children: [],
      })
    } else if (/\s/.test(char)) {
      // Handle whitespace
      result.push({
        type: "element",
        tagName: "span",
        properties: { className: ["zhongwen-space"] },
        children: [{ type: "text", value: char }],
      })
    } else {
      // Handle punctuation and other characters
      result.push({
        type: "element",
        tagName: "span",
        properties: { className: ["zhongwen-punct"] },
        children: [{ type: "text", value: char }],
      })
    }
  }

  return result
}

// Extract text content from HAST node recursively
function extractText(node: Element | Text): string {
  if (node.type === "text") {
    return node.value
  } else if (node.type === "element" && node.children) {
    return node.children.map((child) => extractText(child as Element | Text)).join("")
  }
  return ""
}

// Check if node has zh-cn language
function isZhCnCodeBlock(node: Element): boolean {
  if (!node.properties) return false

  // Check data-language attribute (set by rehype-pretty-code)
  // The property may be stored as data-language or dataLanguage depending on processing
  const dataLang = node.properties["data-language"] || node.properties["dataLanguage"]
  if (dataLang === "zh-cn") {
    return true
  }

  // Check className for language-zh-cn
  const className = node.properties.className
  if (Array.isArray(className)) {
    return className.some((c) => typeof c === "string" && c === "language-zh-cn")
  }

  return false
}

export const ZhongwenBlock: QuartzTransformerPlugin<Partial<ZhongwenOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "ZhongwenBlock",
    htmlPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // Process nodes in a second pass to avoid issues with tree modification
            const nodesToReplace: Array<{
              parent: Element
              index: number
              replacement: Element
            }> = []

            visit(tree, "element", (node, index, parent) => {
              if (typeof index !== "number" || !parent) return

              // Handle figure > pre > code (rehype-pretty-code format)
              const hasRehypePrettyCode =
                node.properties &&
                ("data-rehype-pretty-code-figure" in node.properties ||
                  "dataRehypePrettyCodeFigure" in node.properties)
              if (node.tagName === "figure" && hasRehypePrettyCode) {
                const pre = node.children.find(
                  (child): child is Element => child.type === "element" && child.tagName === "pre",
                )

                if (pre) {
                  const code = pre.children.find(
                    (child): child is Element => child.type === "element" && child.tagName === "code",
                  )

                  if (code && isZhCnCodeBlock(code)) {
                    const textContent = extractText(code)

                    if (textContent.trim()) {
                      const processedChildren = processChineseText(textContent.trim())

                      const zhongwenBlock: Element = {
                        type: "element",
                        tagName: "div",
                        properties: {
                          className: ["zhongwen-block"],
                          "data-pinyin": "always",
                          "data-colors": "on",
                        },
                        children: processedChildren,
                      }

                      nodesToReplace.push({
                        parent: parent as Element,
                        index,
                        replacement: zhongwenBlock,
                      })
                    }
                  }
                }
              }

              // Handle pre > code (standard format without rehype-pretty-code)
              if (node.tagName === "pre") {
                const code = node.children.find(
                  (child): child is Element => child.type === "element" && child.tagName === "code",
                )

                if (code && isZhCnCodeBlock(code)) {
                  const textContent = extractText(code)

                  if (textContent.trim()) {
                    const processedChildren = processChineseText(textContent.trim())

                    const zhongwenBlock: Element = {
                      type: "element",
                      tagName: "div",
                      properties: {
                        className: ["zhongwen-block"],
                        "data-pinyin": "always",
                        "data-colors": "on",
                      },
                      children: processedChildren,
                    }

                    nodesToReplace.push({
                      parent: parent as Element,
                      index,
                      replacement: zhongwenBlock,
                    })
                  }
                }
              }
            })

            // Apply replacements in reverse order to maintain correct indices
            for (let i = nodesToReplace.length - 1; i >= 0; i--) {
              const { parent, index, replacement } = nodesToReplace[i]
              parent.children[index] = replacement
            }
          }
        },
      ]
    },
  }
}
