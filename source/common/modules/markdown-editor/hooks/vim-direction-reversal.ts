/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Vim Direction-Aware Key Reversal Plugin (CodeMirror 6)
 * CVM-Role:        Extension
 * Maintainer:      Orwa Diraneyya
 * License:         GNU GPL v3
 *
 * Description:     Provides direction-aware reversal of Vim navigation commands
 *                  (h/l) based on document text direction. When enabled and
 *                  document is RTL, 'l' moves left and 'h' moves right.
 *
 *                  Integrates with textDirection plugin for direction detection.
 *                  Works seamlessly with vimFixedKeyboardLayout feature.
 *
 * END HEADER
 */

import { type Extension, EditorView, ViewPlugin, type PluginValue } from '@codemirror/view'
import { getCM, Vim } from '@replit/codemirror-vim'
import { configField } from '../util/configuration'

/**
 * Mapping of Vim commands that should be reversed in RTL mode
 * Key: physical key code, Value: [LTR command, RTL command]
 */
const REVERSIBLE_COMMANDS: Record<string, [string, string]> = {
  // Basic horizontal movement
  'KeyH': ['h', 'l'],  // h (left in LTR) ↔ l (right in LTR)
  'KeyL': ['l', 'h']   // l (right in LTR) ↔ h (left in LTR)
}

/**
 * Plugin that intercepts h/l key presses and reverses them based on
 * document text direction when vimReverseDirectionKeys is enabled
 */
class VimDirectionReversalPlugin implements PluginValue {
  private keydownHandler: (event: KeyboardEvent) => void

  constructor (private view: EditorView) {
    this.keydownHandler = this.handleKeydown.bind(this)

    // Add listener in capture phase to intercept BEFORE other vim plugins
    // This ensures we can reverse h/l before custom key mappings process them
    this.view.dom.addEventListener('keydown', this.keydownHandler, true)

    console.log('[Vim Direction Reversal] Plugin initialized')
  }

  update (): void {
    // Nothing to do on updates - we read state dynamically
  }

  destroy (): void {
    this.view.dom.removeEventListener('keydown', this.keydownHandler, true)
  }

  private handleKeydown (event: KeyboardEvent): void {
    // Get configuration
    const config = this.view.state.field(configField)

    // Early exit if feature is disabled
    if (!config.vimReverseDirectionKeys) {
      return
    }

    // Early exit if not in vim mode
    if (config.inputMode !== 'vim') {
      return
    }

    // Get vim state
    const cm = getCM(this.view)
    const vimState = cm?.state?.vim

    if (!vimState) {
      return // Vim not initialized
    }

    // Only process in Normal, Visual, and Operator-pending modes
    const mode = vimState.mode || 'normal'
    if (mode !== 'normal' && mode !== 'visual' && mode !== 'operator') {
      return
    }

    // Check if this is a reversible command
    if (!REVERSIBLE_COMMANDS[event.code]) {
      return
    }

    // Ignore modified keys (Ctrl+h, Alt+h, etc.) - those are for other purposes
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return
    }

    // Get current document direction from the DOM (set by textDirection plugin)
    const currentDirection = this.view.dom.getAttribute('dir') as 'ltr' | 'rtl' | null

    if (!currentDirection) {
      // No direction set yet, default to LTR behavior
      return
    }

    // Only reverse in RTL mode
    if (currentDirection !== 'rtl') {
      return
    }

    // Get the reversed command
    const [ltrCommand, rtlCommand] = REVERSIBLE_COMMANDS[event.code]
    const commandToExecute = rtlCommand // Use RTL command since we're in RTL mode

    console.log(`[Vim Direction Reversal] Reversing command in RTL mode: ${event.key} (${event.code}) → vim command '${commandToExecute}'`)

    // Prevent default and stop propagation
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    // Execute the reversed command via Vim API
    try {
      if (cm) {
        // Use handleKey to execute the reversed command
        // The 'user' origin indicates this is a user-initiated action
        (Vim as any).handleKey(cm, commandToExecute, 'user')
      }
    } catch (error) {
      console.error('[Vim Direction Reversal] Error executing vim command:', error)
    }
  }
}

/**
 * Creates the vim direction reversal extension
 */
export function vimDirectionReversal (): Extension {
  return ViewPlugin.fromClass(VimDirectionReversalPlugin)
}
