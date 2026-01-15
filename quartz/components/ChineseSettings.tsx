// @ts-ignore
import chineseSettingsScript from "./scripts/chinese-settings.inline"
import styles from "./styles/chinese-settings.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ChineseSettings: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={classNames(displayClass, "chinese-settings")} id="chinese-settings">
      <button class="chinese-settings-toggle" aria-label="Chinese text settings">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z" />
        </svg>
      </button>
      <div class="chinese-settings-panel" aria-hidden="true">
        <div class="chinese-settings-header">
          <span>Chinese Text Settings</span>
          <button class="chinese-settings-close" aria-label="Close settings">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="chinese-settings-option">
          <label>Pinyin display</label>
          <div class="chinese-settings-buttons" data-setting="pinyin">
            <button data-value="always" class="active">Always</button>
            <button data-value="hover">Hover</button>
            <button data-value="hidden">Hidden</button>
          </div>
        </div>
        <div class="chinese-settings-option">
          <label>Tone colors</label>
          <div class="chinese-settings-buttons" data-setting="colors">
            <button data-value="on" class="active">On</button>
            <button data-value="off">Off</button>
          </div>
        </div>
      </div>
    </div>
  )
}

ChineseSettings.afterDOMLoaded = chineseSettingsScript
ChineseSettings.css = styles

export default (() => ChineseSettings) satisfies QuartzComponentConstructor
