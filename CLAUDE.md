# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zettlr is an Electron-based Markdown editor for the 21st century, built with TypeScript, Vue 3, and CodeMirror 5. It's designed for academic writing, research, and Zettelkasten knowledge management.

**Version**: 2.3.0
**License**: GPL-3.0
**Tech Stack**: Electron 17, TypeScript, Vue 3, Vuex, CodeMirror 5, Webpack 5

## Development Commands

### Starting Development

```bash
# Install dependencies (first time or after pulling)
yarn install --frozen-lockfile

# Start app in development mode
yarn start

# Start app in test mode (isolated config/directory)
# MUST use --clean flag on first run or after removing test directory
yarn test-gui --clean
```

### Building and Packaging

```bash
# Lint code
yarn lint

# Run unit tests
yarn test

# Package application (current platform, skips typechecking)
yarn package
yarn package:mac-x64
yarn package:mac-arm
yarn package:win-x64
yarn package:linux-x64

# Create release installer (platform-specific)
yarn release:mac-x64
yarn release:mac-arm
yarn release:win-x64
yarn release:linux-x64
```

### Utility Commands

```bash
# Download latest translations (automated, don't commit)
yarn lang:refresh

# Download CSL citation styles (automated, don't commit)
yarn csl:refresh

# Rebuild reveal.js presentation files (automated, don't commit)
yarn reveal:build

# Update citation utilities
yarn update:citation
```

## Architecture Overview

### Process Architecture

Zettlr is an Electron app with a **main process** and multiple **renderer processes** (windows). The architecture follows these principles:

1. **Service Providers** run in the main process autonomously, providing app-wide functionality
2. **Modules** in the main process provide on-demand functionality triggered by user actions
3. **Windows** are separate renderer processes with their own Vue applications

### Directory Structure

```
source/
├── app/                          # Boot/shutdown & service providers
│   ├── service-providers/        # Autonomous background services
│   │   ├── config/              # Configuration management
│   │   ├── fsal/                # File System Abstraction Layer
│   │   ├── commands/            # User-triggered commands (export, import)
│   │   └── [appearance, assets, citeproc, css, dictionary,
│   │        documents, links, log, menu, notifications,
│   │        recent-docs, stats, tags, targets, translations, tray]
│   └── lifecycle.ts             # Application boot/shutdown
│
├── main/                         # Main process
│   └── zettlr.ts                # Main application orchestrator
│
├── common/                       # Shared code (all renderers)
│   ├── modules/
│   │   ├── markdown-editor/     # CodeMirror editor wrapper
│   │   │   ├── index.ts         # Main MarkdownEditor class
│   │   │   ├── load-plugins.ts  # Loads CM modes, keymaps (vim/emacs), addons
│   │   │   ├── hooks/           # Event-driven plugins (formatting, autocomplete, etc.)
│   │   │   ├── plugins/         # CM plugins (search, autocorrect, footnotes, etc.)
│   │   │   └── modes/           # Custom CM modes (markdown-zkn, readability, spellchecker)
│   │   ├── preload/             # Electron preload scripts
│   │   └── window-register/     # Renderer initialization
│   ├── vue/                     # Shared Vue components
│   ├── less/                    # Themes (berlin, frankfurt, bielefeld, etc.)
│   └── util/                    # Utility functions
│
├── win-main/                     # Main window
├── win-preferences/              # Preferences dialog
│   └── schema/                  # Preference form schemas
│       └── editor.ts            # Editor settings (vim, emacs, inputMode, etc.)
└── win-[about, custom-css, defaults, error, log-viewer,
        paste-image, print, quicklook, stats, tag-manager, update]

static/                           # Static assets (translations, CSL, etc.)
scripts/                          # Build scripts and test utilities
test/                            # Mocha unit tests
```

### Application Lifecycle

**Startup:**
1. `source/main.ts` entry point
2. `source/app/lifecycle.ts::bootApplication()` - environment check, boot service providers
3. `source/main/zettlr.ts` - boot main application
4. Load file tree and documents (via FSAL service provider)
5. Show main window

**Shutdown:**
1. Close all windows except main
2. Attempt to close main window
3. `source/main/zettlr.ts::shutdown()` - shutdown main app
4. `source/app/lifecycle.ts::shutdownApplication()` - shutdown service providers
5. Exit

### Build Process

**Development (`yarn start`, `yarn test-gui`):**
1. Electron Forge compiles main + renderer processes separately (TypeScript + Webpack)
2. Output placed in `.webpack/` directory
3. Development servers started for HMR
4. App launched

**Production (`yarn package`, `yarn release`):**
1. Electron Forge packages compiled code into `.webpack/`
2. Packages placed in `./out/`
3. Electron Builder wraps packages into installers (DMG, EXE, AppImage, etc.)
4. Installers placed in `./release/`

## Key Implementation Details

### CodeMirror Editor

The `MarkdownEditor` class (`source/common/modules/markdown-editor/index.ts`) wraps CodeMirror 5 with Zettlr-specific functionality:

- **Vim Mode**: Loaded via `codemirror/keymap/vim` in `load-plugins.ts`
- **Input Modes**: Configurable via `editor.inputMode` setting (`'default' | 'vim' | 'emacs'`)
- **Hooks**: Event-driven plugins attached in constructor (footnotes, autocomplete, formatting bar, etc.)
- **Custom Modes**: `markdown-zkn` (Zettelkasten), `readability`, `spellchecker`, `multiplex`
- **Key Events**: CodeMirror events propagated via EventEmitter pattern

### Configuration System

Configuration managed by the `config` service provider:

- **Template**: `source/app/service-providers/config/get-config-template.ts`
- **Schema**: Defines all settings with defaults
- **Settings UI**: `source/win-preferences/schema/` defines preference forms
- **Editor Settings**: Located in `config.editor` object
  - `inputMode`: Controls vim/emacs/default mode
  - `rtlMoveVisually`: RTL cursor movement
  - `direction`: 'ltr' | 'rtl'
  - Font size, indentation, autocomplete, etc.

### Path Aliases (tsconfig.json)

```typescript
import '@common/*'    // → source/common/*
import '@providers/*' // → source/app/service-providers/*
import '@dts/*'       // → source/types/*
```

### Service Providers vs. Modules

- **Service Providers** (`source/app/service-providers/`): Autonomous, run continuously in main process
  - Examples: config, fsal, documents, menu, notifications
- **Modules** (`source/app/service-providers/commands/`): User-triggered, on-demand
  - Examples: export, import

### Window Management

Each window is a separate renderer process with its own Vue app:
- `win-main`: Main editor window
- `win-preferences`: Settings dialog
- `win-about`, `win-stats`, etc.: Utility windows

Communication via Electron IPC (`ipcRenderer`/`ipcMain`).

## CodeMirror 5 Specifics

**Version**: 5.65.3 (specified in package.json)

**Vim Mode Integration**:
- Loaded in `source/common/modules/markdown-editor/load-plugins.ts` line 34
- Vim mode emits `vim-mode-change` event with `{mode: 'normal'|'insert'|'visual'|'replace'}`
- Key events intercepted via CodeMirror's event system
- Keymap generated in `generate-keymap.ts`

**Event System**:
- CodeMirror events: `change`, `cursorActivity`, `mousedown`, `keydown`, `keyup`
- Hooks use these events to implement features (see `source/common/modules/markdown-editor/hooks/`)

## Testing

```bash
# Run all unit tests
yarn test

# Tests are in ./test/ directory
# Use Mocha framework
# Example tests: count-words.spec.ts, extract-citations.spec.ts, generate-toc.spec.ts
```

## Command-Line Flags

```bash
# Launch minimized (sets system.leaveAppRunning to true)
--launch-minimized

# Clear FSAL cache on boot
--clear-cache

# Custom data directory (config location)
--data-dir=path

# Disable hardware acceleration
--disable-hardware-acceleration
```

## Important Notes

- **DO NOT commit** files updated by `yarn lang:refresh`, `yarn csl:refresh`, `yarn reveal:build` - these are automated
- **Always use** `yarn install --frozen-lockfile` to ensure consistent dependencies
- **Test mode** (`yarn test-gui`) requires `--clean` flag on first run to create test directory
- **Package command** skips typechecking for speed - ensure code is clean before packaging
- **Hot Module Reloading** is active in development - press F5 after HMR finishes
- **TypeScript paths**: Use path aliases defined in tsconfig.json
- **CodeMirror version**: 5.x (not 6.x) - check docs at codemirror.net/5/

## Feature Request: Vim Fixed Keyboard Layout

See appendix below for detailed specification of a requested feature to support fixed keyboard layouts in Vim Normal mode for RTL/non-Latin language users.

---

# APPENDIX: Fixed Keyboard Layout for Vim Normal Mode

## Problem Statement

Zettlr 2.3.0 includes Vim mode (powered by CodeMirror's vim keybindings), but users who write in RTL or non-Latin languages (Arabic, Hebrew, Persian, etc.) face a critical usability issue:

- **In Insert Mode**: Users need to type in their native language (e.g., Arabic) using their system's current keyboard layout
- **In Normal Mode**: Vim navigation keys (h, j, k, l, w, b, etc.) only work with an English/Latin keyboard layout

Currently, users must manually switch their operating system's keyboard layout every time they enter Normal mode to use Vim commands, which breaks workflow and makes Vim mode nearly unusable for bilingual writers.

## The Correct Solution

**The solution is NOT to switch the system's keyboard layout automatically**, but rather to **ensure Vim commands use a fixed keyboard layout (English/Latin) in Normal mode, regardless of the active system keyboard layout**.

This approach:
- ✅ Allows users to type in ANY language in Insert mode without interruption
- ✅ Ensures Vim commands always work in Normal mode, no matter what keyboard is active
- ✅ Does NOT cause jarring system-level keyboard switches
- ✅ Respects the user's current keyboard selection when they return to Insert mode

## Desired Behavior

When Vim mode is enabled in Zettlr with this feature:

1. **Normal Mode** (after ESC, Ctrl+[, Ctrl+C):
   - Vim commands (h, j, k, l, w, b, etc.) are interpreted using a **fixed English/Latin keyboard mapping**
   - The system's keyboard layout indicator does NOT change
   - Users can still see their Arabic/other keyboard is active at the system level

2. **Insert Mode** (after i, a, o, O, I, A, s, S, c, etc.):
   - Users type with whatever keyboard layout is currently active at the system level
   - No interference with their typing
   - Keyboard layout is completely under user control

3. **Visual Mode**:
   - Same as Normal mode - uses fixed English/Latin mapping for commands

This behavior should be:
- **Optional**: Controlled by a user preference setting
- **Configurable**: Allow users to specify which keyboard layout to use for Normal mode commands
- **Non-intrusive**: Should not affect users who don't enable this feature
- **Transparent**: Should not cause visible keyboard switching at the OS level

## Technical Implementation

### 1. Core Concept: Key Remapping, Not System Switching

Instead of calling external commands to switch the OS keyboard layout, the solution should **remap keyboard input within the editor** when in Normal mode.

**Implementation approach:**
- When entering Normal mode, intercept keyboard events
- Map the physical keys to their English/Latin equivalents for Vim commands
- When entering Insert mode, stop intercepting and let the system keyboard work normally

This is similar to how Obsidian's "Use a fixed keyboard layout for Normal mode" feature works.

### 2. Configuration Settings

Add new settings to Zettlr's preferences (Editor section):

```javascript
{
  "vim": {
    "fixedNormalModeLayout": false,  // Enable/disable the feature
    "normalModeKeyboardLayout": "qwerty",  // Layout to use for Normal mode (qwerty, azerty, qwertz, etc.)
    // Alternative: could use system locale/layout identifier
    "normalModeLayoutLocale": "en-US"  // Or: "com.apple.keylayout.US" on macOS
  }
}
```

### 3. CodeMirror Vim Mode Integration

Zettlr uses CodeMirror's vim mode implementation. The integration should happen at the key event handling level.

**Key CodeMirror Events/Hooks:**

1. **Mode Change Detection**: CodeMirror's vim mode emits a `vim-mode-change` signal
   - Reference: CodeMirror 5 uses `CodeMirror.signal(cm, "vim-mode-change", {mode: "normal"})`
   - The event provides the new mode: `"insert"`, `"normal"`, `"visual"`, `"replace"`

2. **Key Event Interception**:
   - Hook into CodeMirror's key event handling
   - When in Normal/Visual mode, remap keys before passing to Vim commands
   - When in Insert mode, let keys pass through normally

**Example Pseudo-code:**

```javascript
// Keyboard layout mappings
const LAYOUT_MAPPINGS = {
  'arabic': {
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't',
    'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
    'ش': 'a', 'س': 's', 'ي': 'd', 'ب': 'f', 'ل': 'g',
    'ا': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l',
    'ئ': 'z', 'ء': 'x', 'ؤ': 'c', 'ر': 'v', 'ى': 'b',
    'ة': 'n', 'و': 'm',
    // ... complete mapping
  },
  'hebrew': {
    'ק': 'q', 'ר': 'w', 'א': 'e', 'ט': 'r', 'ו': 't',
    // ... complete mapping
  },
  // Add more keyboard layouts as needed
};

// In Zettlr's editor setup
let currentVimMode = 'normal';

editor.on('vim-mode-change', (modeInfo) => {
  currentVimMode = modeInfo.mode;
});

// Key event handler
editor.on('keydown', (event) => {
  if (config.get('vim.fixedNormalModeLayout') &&
      (currentVimMode === 'normal' || currentVimMode === 'visual')) {

    // Detect current system keyboard layout
    const systemLayout = detectSystemKeyboardLayout();

    // If not using English/Latin layout, remap the key
    if (systemLayout !== 'qwerty' && LAYOUT_MAPPINGS[systemLayout]) {
      const remappedChar = LAYOUT_MAPPINGS[systemLayout][event.key];
      if (remappedChar) {
        // Create a new event with the remapped key
        event.preventDefault();
        const remappedEvent = new KeyboardEvent('keydown', {
          key: remappedChar,
          code: event.code,
          // ... copy other properties
        });
        editor.triggerKeyEvent(remappedEvent);
      }
    }
  }
  // In Insert mode, let the event pass through normally
});
```

### 4. Keyboard Layout Detection Module

Create a module to detect the current system keyboard layout:

```typescript
export class KeyboardLayoutDetector {
  /**
   * Detect the current active keyboard layout
   * Returns a layout identifier (e.g., 'arabic', 'hebrew', 'qwerty')
   */
  static detectCurrentLayout(): string {
    // Platform-specific detection
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: Use im-select or similar to get current input source
      // Then map input source ID to layout name
      return this.detectMacOSLayout();
    } else if (platform === 'win32') {
      // Windows: Query current keyboard layout
      return this.detectWindowsLayout();
    } else {
      // Linux: Check environment variables or use xkb utilities
      return this.detectLinuxLayout();
    }
  }

  private static detectMacOSLayout(): string {
    // Execute: im-select to get input source
    // Map known input sources to layout names
    // e.g., "com.apple.keylayout.Arabic" -> "arabic"
  }

  // ... platform-specific implementations
}
```

**Alternative simpler approach:**
If reliable keyboard layout detection is difficult, use a simpler heuristic:
- Detect based on the characters being typed
- If user types Arabic characters, assume Arabic keyboard
- Cache the detected layout for performance

### 5. UI Configuration Panel

Add a new section to the Vim settings in the preferences dialog:

**Settings UI Elements:**

1. **Checkbox**: "Use fixed keyboard layout for Normal mode" (`vim.fixedNormalModeLayout`)
2. **Help Text**: "When enabled, Vim commands in Normal mode will use English/Latin key mappings regardless of your active keyboard layout"
3. **Dropdown**: "Keyboard layout for Normal mode"
   - Options: "QWERTY (US/UK)", "QWERTZ (German)", "AZERTY (French)", "Auto-detect"
4. **Optional Advanced Section**:
   - Manual key mapping overrides for uncommon keyboard layouts
   - Test area to verify key mappings work correctly

**Simplified UI Alternative:**
Just a single checkbox: "Use English key mappings for Vim Normal mode"
- Default: Assumes QWERTY
- Auto-detects common non-Latin keyboard layouts (Arabic, Hebrew, Cyrillic, etc.)
- Provides correct mappings automatically

### 6. Error Handling

The feature must fail gracefully:

1. **Unknown Keyboard Layout**: If the keyboard layout cannot be detected, fall back to pass-through (let keys work as-is)
2. **Missing Mappings**: If a key mapping is not defined, let the key pass through normally
3. **Performance**: Key remapping must be fast (< 1ms) to not introduce input lag
4. **Toggle Off**: Users should be able to quickly disable the feature if it causes issues

### 7. Testing Checklist

- [ ] Feature works on Windows with Arabic/Hebrew/other non-Latin keyboards
- [ ] Feature works on macOS with multiple input sources
- [ ] Feature works on Linux with various keyboard layouts
- [ ] No perceptible input lag in Normal mode (< 1ms remapping time)
- [ ] All common Vim commands work correctly (hjkl, w, b, dw, ciw, etc.)
- [ ] Feature can be disabled completely
- [ ] Settings persist across restarts
- [ ] Vim mode still functions normally when feature is disabled
- [ ] Works correctly with modifier keys (Shift, Ctrl, Alt/Option)
- [ ] No interference with Insert mode typing
- [ ] Keyboard layout detection is accurate

## Implementation Files

Based on Zettlr 2.3.0 architecture:

1. **Configuration Schema**: `source/app/service-providers/config/get-config-template.ts` - Add vim.fixedNormalModeLayout settings
2. **Settings UI**: `source/win-preferences/schema/editor.ts` - Add UI controls
3. **Editor Initialization**: `source/common/modules/markdown-editor/index.ts` - Hook into CodeMirror vim mode changes and key events
4. **Keyboard Mapping Module**: `source/common/modules/markdown-editor/keyboard-layout-mapper.ts` - New module for key remapping logic
5. **Layout Detection Module**: `source/common/modules/markdown-editor/keyboard-layout-detector.ts` - Optional module for auto-detecting layouts

## References

1. CodeMirror 5 Vim Mode: https://codemirror.net/5/demo/vim.html
2. CodeMirror Vim Mode Signal: `vim-mode-change` event
3. CodeMirror Key Event Handling: https://codemirror.net/5/doc/manual.html#events
4. Obsidian's Vimrc Support: Implements "Use a fixed keyboard layout for Normal mode" (the inspiration for this approach)
5. Keyboard layout mappings: Common QWERTY → Arabic/Hebrew/etc. character mappings

## How This Differs from Other Implementations

**VSCode Vim / Other Editors:**
- Many editors use external tools (im-select) to switch system keyboard layouts
- This causes jarring visual feedback as the OS keyboard indicator changes
- Can conflict with user's keyboard switching habits

**This Approach (Used by Obsidian):**
- ✅ No system-level keyboard switching
- ✅ No external dependencies (im-select not needed)
- ✅ Works entirely within the application
- ✅ User maintains full control of their system keyboard
- ✅ More elegant and less intrusive

## Benefits

1. **Dramatically improves usability** for users who write in RTL or non-Latin languages
2. **Reduces friction** for bilingual writers using Vim mode
3. **More elegant than system-level switching** - no jarring keyboard indicator changes
4. **No external dependencies** - works entirely within the application
5. **Optional feature** - doesn't affect users who don't need it
6. **Respects user control** - users maintain full control over their system keyboard
7. **Better performance** - no subprocess calls, just in-memory key remapping

## Priority Justification

This is a **high-impact accessibility feature** that:
- Makes Vim mode actually usable for a significant portion of potential users (anyone writing in non-Latin scripts)
- Addresses a fundamental workflow blocker
- Has a proven, elegant implementation (see Obsidian's approach)
- Requires relatively contained changes to the codebase
- Does not require external dependencies or system-level integration
- Provides a better user experience than the "automatic switching" approach used by some other editors

## Why This Approach is Better Than Automatic Switching

**Problems with automatic keyboard switching (used by VSCode Vim, some others):**
1. ❌ Requires external tools (im-select.exe, etc.)
2. ❌ Causes visual distraction (OS keyboard indicator changes)
3. ❌ Can be slow (subprocess execution overhead)
4. ❌ Conflicts with user's own keyboard switching habits
5. ❌ Platform-specific (different tools for Windows/Mac/Linux)

**Advantages of fixed keyboard layout in Normal mode (Obsidian's approach):**
1. ✅ No external dependencies
2. ✅ No visual distraction - system keyboard stays as-is
3. ✅ Fast - just in-memory key mapping
4. ✅ User maintains control - can switch keyboards anytime
5. ✅ Cross-platform - same logic works everywhere
6. ✅ More intuitive - "Vim uses English keys, I use my keyboard"

## Questions for Implementation

1. What version of CodeMirror does Zettlr 2.3.0 use? (Affects vim-mode-change event handling and key event interception approach)
   - **Answer: 5.65.3**
2. Does Zettlr's editor run in the renderer process? (Affects where keyboard layout detection code lives)
   - **Answer: Yes, in source/common/modules/markdown-editor/**
3. Should we ship with pre-defined mappings for common keyboard layouts, or auto-detect?
4. Should we provide a UI for users to test/verify that key mappings work correctly?
5. How should we handle edge cases like keyboard layouts that aren't QWERTY-based (e.g., Dvorak users who also use Arabic)?

## Implementation Notes

**Keyboard Layout Mappings to Include:**

Priority layouts (most common):
- Arabic (Standard)
- Hebrew
- Russian (Cyrillic)
- Persian/Farsi
- Greek
- Chinese Pinyin
- Japanese
- Korean

Secondary layouts:
- Arabic PC
- AZERTY (French)
- QWERTZ (German)
- Various Cyrillic variants

**Key Mapping Example (Arabic → QWERTY):**
```javascript
{
  'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't',
  'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
  'ج': '[', 'د': ']', 'ش': 'a', 'س': 's', 'ي': 'd',
  'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k',
  'م': 'l', 'ك': ';', 'ط': '\'', 'ئ': 'z', 'ء': 'x',
  'ؤ': 'c', 'ر': 'v', 'لا': 'b', 'ى': 'n', 'ة': 'm',
  'و': ',', 'ز': '.', 'ظ': '/'
}
```

---

**Document Version**: 3.0
**Created**: 2025-11-07
**Updated**: 2025-11-07
**Target Zettlr Version**: 2.3.0 or later
**Approach**: Fixed keyboard layout mapping (inspired by Obsidian's implementation)
