/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Vim Fixed Keyboard Hook
 * CVM-Role:        Controller
 * Maintainer:      Orwa Diraneyya
 * License:         GNU GPL v3
 *
 * Description:     Enables fixed keyboard layout for Vim Normal mode using
 *                  physical key positions instead of characters. This intercepts
 *                  keydown events at the DOM level BEFORE CodeMirror processes
 *                  them, remaps physical keys to their Vim command equivalents,
 *                  and then manually triggers Vim's key handling.
 *
 * END HEADER
 */

import CodeMirror from 'codemirror'
import { getVimCommandForPhysicalKey } from '../keyboard-layout-mapper'

/**
 * Stores the current Vim mode for each editor instance
 */
const editorModes = new WeakMap<CodeMirror.Editor, string>();

/**
 * Stores the native keydown listener for each editor's input field
 * so we can properly clean it up if needed
 */
const keydownListeners = new WeakMap<HTMLElement, EventListener>();

/**
 * Re-entry guard to prevent infinite recursion when vim.handleKey()
 * triggers additional keyboard events
 */
const processingKeys = new WeakMap<CodeMirror.Editor, boolean>();

export default function vimFixedKeyboard (cm: CodeMirror.Editor): void {
  const vim = (CodeMirror as any).Vim

  if (!vim) {
    console.error('[Vim Fixed Keyboard] CodeMirror Vim not available');
    return;
  }

  // Check if feature is enabled via configuration
  const isVimMode = window.config.get('editor.inputMode') === 'vim';
  const isFeatureEnabled = Boolean(window.config.get('editor.vimFixedKeyboardLayout'));

  console.log('[Vim Fixed Keyboard] Debug - inputMode:', window.config.get('editor.inputMode'));
  console.log('[Vim Fixed Keyboard] Debug - vimFixedKeyboardLayout:', window.config.get('editor.vimFixedKeyboardLayout'));
  console.log('[Vim Fixed Keyboard] Debug - isVimMode:', isVimMode);
  console.log('[Vim Fixed Keyboard] Debug - isFeatureEnabled:', isFeatureEnabled);

  // Only proceed if both Vim mode AND fixed keyboard are enabled
  if (!isVimMode || !isFeatureEnabled) {
    console.log('[Vim Fixed Keyboard] Feature NOT initialized - requirements not met');
    return;
  }

  console.log('[Vim Fixed Keyboard] ✓ Feature initialized successfully');

  // Initialize processing guard
  processingKeys.set(cm, false);

  // Track vim mode changes
  (cm as any).on('vim-mode-change', (modeObj: any) => {
    editorModes.set(cm, modeObj.mode);
  });

  // Initialize mode to 'normal'
  editorModes.set(cm, 'normal');

  // Get the input field that CodeMirror uses for key events
  const inputField = cm.getInputField();

  /**
   * This event listener intercepts keydown events at the DOM level,
   * BEFORE CodeMirror's own keydown handler processes them.
   * We use the 'capture' phase (useCapture = true) to ensure we run first.
   */
  const keydownListener = (event: Event): void => {
    // Prevent re-entry - if we're already processing a key, don't process again
    if (processingKeys.get(cm)) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const mode = editorModes.get(cm) || 'normal';

    // Only process in Normal and Visual modes
    if (mode !== 'normal' && mode !== 'visual') {
      return;
    }

    // Don't intercept modified keys (Ctrl, Alt, Meta)
    // These are used for vim commands like Ctrl-f, Ctrl-b, etc.
    if (keyboardEvent.ctrlKey || keyboardEvent.altKey || keyboardEvent.metaKey) {
      return;
    }

    // Don't intercept special keys that vim needs (Escape, Enter, etc.)
    const specialKeys = ['Escape', 'Enter', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (specialKeys.includes(keyboardEvent.key)) {
      return;
    }

    // Check if this physical key maps to a Vim command
    // Pass the shift key state to handle uppercase commands (I, A, O, etc.)
    const vimCommand = getVimCommandForPhysicalKey(keyboardEvent.code, keyboardEvent.shiftKey);

    console.log(`[Vim Fixed Keyboard] Key pressed - code: ${keyboardEvent.code}, key: ${keyboardEvent.key}, shift: ${keyboardEvent.shiftKey}, vimCommand: ${vimCommand}`);

    if (vimCommand !== null) {
      // Prevent the browser and CodeMirror from processing the original key
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      keyboardEvent.stopImmediatePropagation();

      // Set the guard to prevent re-entry
      processingKeys.set(cm, true);

      try {
        // Use Vim's handleKey API directly
        vim.handleKey(cm, vimCommand, 'user');
      } finally {
        // Always clear the guard, even if an error occurs
        processingKeys.set(cm, false);
      }
    }
  };

  // Add the event listener in the CAPTURE phase to intercept before CodeMirror
  // The capture phase runs before the bubble phase, so we get the event first
  inputField.addEventListener('keydown', keydownListener, true);

  // Store the listener so we can remove it later if needed
  keydownListeners.set(inputField, keydownListener);
}

/**
 * Cleanup function to remove event listeners when config changes or editor is destroyed
 */
export function vimFixedKeyboardCleanup (cm: CodeMirror.Editor): void {
  const inputField = cm.getInputField();
  const listener = keydownListeners.get(inputField);

  if (listener) {
    inputField.removeEventListener('keydown', listener, true);
    keydownListeners.delete(inputField);
  }

  editorModes.delete(cm);
  processingKeys.delete(cm);
}
