# Vim Mode Toolbar Toggle Feature

**Status**: ✅ Implemented
**Version**: 3.6.0
**Date**: 2025-11-12

## Overview

Adds an accessible toolbar toggle button to quickly switch Vim mode on/off without navigating to preferences. This feature significantly improves the workflow for Arabic writers and other users who frequently switch between Vim and normal input modes.

## User Story

**Problem**: Users (especially Arabic writers) need to frequently toggle between Vim mode and normal mode. The previous workflow required:
1. Opening preferences (Cmd/Ctrl+,)
2. Navigating to Editor tab
3. Changing Input Mode dropdown
4. Closing preferences

**Solution**: A single-click toolbar toggle button that instantly switches between Vim and normal modes.

## Implementation Details

### Architecture

The feature follows Zettlr's existing toolbar pattern with these key components:

1. **Config Property**: `displayToolbarButtons.showVimModeToggle: boolean`
   - Controls button visibility
   - Default: `false` (opt-in to avoid toolbar clutter)

2. **Toolbar Control**: Binary toggle in main window toolbar
   - **Type**: `toggle`
   - **ID**: `toggle-vim-mode`
   - **Icon**: `terminal` (universally associated with Vim)
   - **Position**: Right section, between Pomodoro timer and Sidebar toggle

3. **Toggle Behavior**:
   - **ON**: Sets `editor.inputMode = 'vim'`
   - **OFF**: Sets `editor.inputMode = 'default'`
   - **Edge Case**: Treats Emacs mode as "off" (clicking toggle enables Vim)

4. **State Synchronization**:
   - Toolbar button reflects current input mode
   - Auto-updates when mode changes via preferences
   - Uses Vue computed property reactivity (no manual sync needed)

### Files Modified

#### 1. Config Schema
**File**: `source/app/service-providers/config/get-config-template.ts`

```typescript
// Line 184: Interface definition
displayToolbarButtons: {
  // ... existing buttons
  showPomodoroButton: boolean
  showVimModeToggle: boolean  // NEW
}

// Line 435: Default value
displayToolbarButtons: {
  // ... existing defaults
  showPomodoroButton: true,
  showVimModeToggle: false  // NEW - opt-in feature
}
```

#### 2. Preferences UI
**File**: `source/win-preferences/schema/appearance.ts`

```typescript
// Lines 203-207: Added checkbox
{
  type: 'checkbox',
  label: trans('Display "Vim mode" toggle'),
  model: 'displayToolbarButtons.showVimModeToggle'
}
```

**Location**: Appearance → Toolbar Options → Right Section (after Pomodoro timer)

#### 3. Toolbar Control
**File**: `source/win-main/App.vue`

```typescript
// Lines 521-528: Control definition in toolbarControls computed property
{
  type: 'toggle',
  id: 'toggle-vim-mode',
  title: trans('Toggle Vim Mode'),
  icon: 'terminal',
  initialState: configStore.config.editor.inputMode === 'vim',
  visible: getToolbarButtonDisplay('showVimModeToggle')
}
```

#### 4. Toggle Handler
**File**: `source/win-main/App.vue`

```typescript
// Lines 902-905: Handler in handleToggle() function
else if (id === 'toggle-vim-mode') {
  // Toggle between vim and default mode
  const newMode = state ? 'vim' : 'default'
  configStore.setConfigValue('editor.inputMode', newMode)
}
```

#### 5. Arabic Translations
**File**: `static/lang/ar-AR.po`

```po
# Lines 770-772: Toolbar button tooltip
#: source/tmp/win-main/App.vue.ts:524
msgid "Toggle Vim Mode"
msgstr "تبديل وضع Vim"

# Lines 3279-3281: Preferences checkbox label
#: source/win-preferences/schema/appearance.ts:205
msgid "Display \"Vim mode\" toggle"
msgstr "عرض زر \"تبديل وضع Vim\""
```

## Design Decisions

### 1. Binary Toggle vs Three-Way Toggle
**Decision**: Binary toggle (vim ↔ default)

**Rationale**:
- Target users (Arabic writers) primarily switch between these two modes
- Emacs mode users are extreme minority
- Simpler UX for common use case
- Emacs users still have preferences access

**Edge Case Handling**:
| Current Mode | Button State | Click Result |
|--------------|--------------|--------------|
| default      | OFF          | vim          |
| vim          | ON           | default      |
| emacs        | OFF          | vim          |

### 2. Default Visibility: Hidden
**Decision**: `showVimModeToggle: false` by default

**Rationale**:
- Avoids toolbar clutter for non-Vim users
- Opt-in approach for power users
- Consistent with other optional toolbar buttons
- Users who need this feature will find it in preferences

### 3. Button Placement
**Decision**: Right section, between Pomodoro timer and Sidebar toggle

**Rationale**:
- Groups with other "mode" toggles (sidebar visibility)
- Right section is less crowded
- Easily accessible but not intrusive
- Consistent with UX patterns

### 4. Icon Choice
**Decision**: `terminal` icon from Clarity Icons

**Rationale**:
- Universally associated with Vim/CLI tools
- Clear visual metaphor
- Already available in icon set
- Alternatives considered: `code`, `keyboard` (less recognizable)

## User Workflow

### Enabling the Feature

1. Open Preferences (Cmd/Ctrl+, or toolbar gear icon)
2. Navigate to **Appearance** tab
3. Scroll to **Toolbar Options** section
4. Check **"Display 'Vim mode' toggle"**
5. Close preferences
6. Toggle button appears in toolbar

### Using the Toggle

**To Enable Vim Mode**:
1. Click toolbar toggle (terminal icon)
2. Button highlights/activates
3. Status bar shows "Vim (Normal)"
4. Vim commands (h/j/k/l, etc.) work immediately

**To Disable Vim Mode**:
1. Click toolbar toggle again
2. Button deactivates
3. Status bar shows "Input Mode: Normal"
4. Vim commands stop working, normal input resumes

### State Synchronization

**Scenario 1**: Change mode via toolbar
- Click toggle → Mode changes instantly
- Preferences dropdown syncs automatically

**Scenario 2**: Change mode via preferences
- Select new mode in Editor → Input Mode dropdown
- Toolbar toggle updates automatically (Vue reactivity)

**Scenario 3**: Switch from Emacs to Vim
- Current mode: Emacs (toggle OFF)
- Click toggle → Vim mode activates (not Default)

## Testing Checklist

### Phase 1: Config Integration
- [ ] Config property saves correctly
- [ ] Default value is `false`
- [ ] Preferences checkbox toggles config value
- [ ] Changes persist across app restarts

### Phase 2: Toolbar Visibility
- [ ] Button hidden when `showVimModeToggle = false`
- [ ] Button appears when `showVimModeToggle = true`
- [ ] Button positioned correctly (right section)
- [ ] Icon renders correctly (`terminal`)

### Phase 3: Toggle Functionality
- [ ] Click toggle → Vim mode activates
- [ ] Status bar shows "Vim (Normal)"
- [ ] Vim commands work (h/j/k/l navigation)
- [ ] Click toggle again → Vim mode deactivates
- [ ] Status bar shows "Input Mode: Normal"
- [ ] Vim commands stop working

### Phase 4: State Synchronization
- [ ] Toolbar reflects current mode on startup
- [ ] Change mode in preferences → toolbar syncs
- [ ] Change mode via toolbar → preferences syncs
- [ ] No delay in updates (instant via config store fix)

### Phase 5: Edge Cases
- [ ] Emacs mode + click toggle → Vim mode (not Default)
- [ ] Multiple document tabs sync state
- [ ] Preferences window open while toggling works
- [ ] Rapid clicking doesn't cause race conditions

### Phase 6: Internationalization
- [ ] English labels display correctly
- [ ] Arabic labels display correctly (عرض زر "تبديل وضع Vim")
- [ ] Tooltip shows translated text

### Phase 7: Cross-Platform
- [ ] macOS: Button works, no layout issues
- [ ] Windows: Button works, no layout issues
- [ ] Linux: Button works, no layout issues

## Benefits for Arabic Writers

1. **Instant Mode Switching**: Single click vs 4-step workflow
2. **Visual Feedback**: Button state clearly shows current mode
3. **Keyboard Independence**: Works with any keyboard layout
4. **Seamless Integration**: Pairs with Vim Fixed Keyboard Layout feature
5. **Workflow Optimization**: Reduces context switching

## Integration with Existing Features

### Vim Fixed Keyboard Layout
- Toggle activates/deactivates Vim mode
- Fixed keyboard mappings remain active when Vim is on
- Both features work independently (can disable toggle, keep mappings)

### Vim Direction Reversal
- Toggle activates/deactivates Vim mode
- Direction reversal applies when Vim mode is active
- Seamless RTL support for Arabic text

### Editor Statusbar
- Statusbar updates immediately when toggle state changes
- Shows current Vim mode (Normal/Insert/Visual/etc.)
- Consistent with existing status indicators

## Technical Notes

### Config Throttling
- Uses `configStore.setConfigValue()` which bypasses 1-second throttle
- Changes take effect instantly (fixed in earlier work)
- See `context/CONFIG_THROTTLING_ISSUE.md` for details

### Vue Reactivity
- Toolbar `initialState` is computed from config
- `toolbarControls` computed property re-evaluates on config change
- `ToggleControl` component watches props and updates UI
- No manual event listeners needed

### Performance
- No performance impact (single config value check)
- Leverages existing Vue reactivity system
- No additional state management needed

## Future Enhancements

### Potential Improvements
1. **Keyboard Shortcut**: Add configurable hotkey for toggle
2. **Three-Way Cycle**: Option to cycle Default → Vim → Emacs → Default
3. **Visual Indicator**: Badge showing current Vim sub-mode (Normal/Insert/Visual)
4. **Context Menu**: Right-click toggle for quick settings access

### Related Features
- Vim mode persistence per-document
- Vim mode profiles (different settings per workspace)
- Quick Vim command palette

## References

- **Architecture Review**: See implementation commit for detailed review
- **Related Docs**:
  - `context/VIM_FIXED_KEYBOARD_EXPLANATION.md`
  - `context/VIM_DIRECTION_REVERSAL_FEATURE.md`
  - `context/CONFIG_THROTTLING_ISSUE.md`
- **Existing Patterns**:
  - `toggle-sidebar` control (source/win-main/App.vue:529-535)
  - `displayToolbarButtons` config schema

## Changelog

### 2025-11-12 - Initial Implementation
- Added `showVimModeToggle` config property
- Added preferences UI checkbox
- Implemented toolbar toggle control
- Added toggle handler
- Added Arabic translations
- Documentation created
