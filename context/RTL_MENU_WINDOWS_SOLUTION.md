# RTL Menu Positioning Fix for Windows

## Problem

When Zettlr is built for Windows with Arabic RTL interface, the menu bar (File, Edit, View) appears on the right side of the window, colliding with the window control buttons (close, maximize, minimize). This makes the window controls completely inaccessible, rendering the application unusable.

## Root Cause

The collision occurs due to the interaction of several architectural components:

1. **Frameless Window**: Windows builds use `frame: false` with custom window chrome
2. **Absolute Positioning**: Window controls are positioned with `position: absolute; right: 0;`
3. **RTL CSS**: The global `.rtl-interface` class applies `flex-direction: row-reverse` to window chrome
4. **Menu Flow**: In RTL mode, menu items shift from left to right
5. **Collision**: Both menus and window controls end up in the same top-right corner

### Technical Details

**Window Controls Component** (`source/common/vue/window/WindowControls.vue`):
```css
div#window-controls {
  position: absolute;
  top: 0;
  right: 0;  /* Always on the right */
  z-index: 2001;
}
```

**MenuBar Component** (`source/common/vue/window/WindowMenubar.vue`):
```css
#menubar {
  height: 31px;
  padding-left: 30px;
  -webkit-app-region: drag;
}
```

**RTL Global Styles** (`source/common/assets/rtl-interface.css`):
```css
.rtl-interface .window-chrome {
  direction: rtl;
  flex-direction: row-reverse;  /* Reverses visual flow */
}
```

## Solution: Platform-Specific Menu Positioning

### Approach

Keep the menubar **LTR (left-to-right) on Windows only**, while maintaining RTL for all content areas (editor, file manager, preferences). This follows Windows UI conventions where:
- Menus appear on the **left**
- Window controls appear on the **right**

### Implementation

**File**: `source/common/assets/rtl-interface.css` (lines 35-49)

```css
/**
 * CRITICAL FIX: Windows RTL Menu Positioning
 *
 * On Windows, the menubar (File, Edit, View) appears on the right side in RTL mode,
 * colliding with window controls (close, maximize, minimize).
 *
 * Solution: Keep menubar LTR on Windows only to prevent collision.
 * - Menu items stack left-to-right
 * - Window controls remain on the right
 * - All content (editor, file manager, preferences) stays RTL
 */
body.win32 .rtl-interface #menubar {
  direction: ltr !important;
  padding-left: 30px; /* Keep logo on left */
  padding-right: 145px; /* Reserve space for window controls (3 buttons × 45px + margin) */
}

body.win32 .rtl-interface #menubar span.top-level-item {
  float: left; /* Ensure menu items stack left-to-right */
}

/* Ensure window controls stay on the right on Windows */
body.win32 .rtl-interface #window-controls {
  right: 0;
  left: auto;
}
```

### What This Does

1. **Overrides menubar direction**: Forces LTR on Windows only using `body.win32` selector
2. **Preserves logo position**: Keeps `padding-left: 30px` for the Zettlr logo
3. **Reserves space**: Adds `padding-right: 145px` for window controls (3 × 45px buttons + margin)
4. **Ensures menu stacking**: Forces `float: left` on menu items
5. **Locks control position**: Explicitly sets window controls at `right: 0`

## Rationale

### Why This Approach?

1. **Architecturally Sound**: Separates UI chrome (menus) from content direction
2. **Platform-Specific**: Only affects Windows where collision occurs
3. **Minimal Changes**: Pure CSS solution, no Electron API modifications needed
4. **Cross-Platform Safe**: macOS and Linux unaffected
5. **Maintains UX**: Arabic content remains RTL, only UI chrome changes
6. **Follows Conventions**: Windows users expect menus on left, controls on right

### Alternative Solutions Considered

#### Custom Title Bar (Rejected)
- **Approach**: Implement custom window controls in Vue
- **Pros**: Full control over positioning
- **Cons**: High complexity, accessibility issues, maintenance burden
- **Why rejected**: Too much risk for the benefit

#### Reserved Padding Only (Rejected)
- **Approach**: Just add padding to prevent overlap
- **Pros**: Simple CSS change
- **Cons**: Doesn't solve root cause, menus still on wrong side visually
- **Why rejected**: Poor UX, doesn't follow platform conventions

## Testing Checklist

### Windows Arabic Build

- [ ] Launch app with Arabic language (`appLang: 'ar-AR'`)
- [ ] Verify menu items (File, Edit, View, etc.) appear on **left** side
- [ ] Verify window controls (close, maximize, minimize) appear on **right** side
- [ ] Verify **no overlap** between menus and window controls
- [ ] Click each menu item - verify dropdowns appear correctly
- [ ] Verify Zettlr logo visible on left side of menubar
- [ ] Verify editor content is **RTL**
- [ ] Verify file manager is **RTL**
- [ ] Verify preferences UI is **RTL**
- [ ] Test window resize - verify menus don't overflow
- [ ] Test maximized window state

### macOS Arabic Build

- [ ] Launch app with Arabic language
- [ ] Verify native macOS menubar works (no custom chrome on macOS)
- [ ] Verify content is RTL

### Linux Arabic Build

- [ ] Launch app with Arabic language
- [ ] With native appearance: verify native menus work
- [ ] Without native appearance: verify custom menus don't overlap
- [ ] Verify content is RTL

### Regression Testing (English Language)

- [ ] Windows: Verify menus on left, controls on right
- [ ] macOS: Verify native menubar
- [ ] Linux: Verify menus work correctly

## Platform Differences

### Windows
- **Custom menubar**: Vue component rendering menu items
- **Custom window controls**: Close/maximize/minimize buttons
- **Fix applies**: Yes - LTR menubar, RTL content

### macOS
- **Native menubar**: Electron's native menu in system menu bar
- **Native controls**: Traffic lights (red/yellow/green) positioned by OS
- **Fix applies**: No - no custom chrome, no collision possible

### Linux
- **Native appearance option**: Can use OS-native menus and window frame
- **Custom appearance**: Uses same custom chrome as Windows
- **Fix applies**: Yes (only if not using native appearance)

## Related Files

- `source/common/assets/rtl-interface.css` - RTL global styles (MODIFIED)
- `source/common/vue/window/WindowMenubar.vue` - Menubar component
- `source/common/vue/window/WindowControls.vue` - Window controls component
- `source/common/vue/window/WindowChrome.vue` - Window chrome container
- `source/common/use-rtl-interface.ts` - RTL interface composable
- `source/app/service-providers/windows/set-window-chrome.ts` - Window config
- `source/app/service-providers/menu/menu.win32.ts` - Windows menu structure

## Additional Notes

### Why Menu Direction Differs from Content

This solution intentionally separates **UI chrome direction** from **content direction**:

- **UI Chrome** (menus, toolbars): Follows platform conventions
  - Windows expects menus on left, controls on right
  - This is consistent across all Windows applications

- **Content** (editor, file manager, preferences): Follows language direction
  - Arabic content flows right-to-left
  - This is the actual user content that needs RTL support

This separation is a common pattern in internationalized applications and provides the best user experience.

### Window Control Dimensions

The window controls component uses:
- **3 buttons**: Minimize, Maximize/Restore, Close
- **45px width each**: Total = 135px
- **Additional margin**: ~10px
- **Reserved space**: 145px (`padding-right` value)

If window control button sizes change in the future, adjust the `padding-right` value accordingly.

## Future Considerations

1. **Dynamic Padding**: Consider calculating padding based on actual window control width
2. **High DPI**: Test on high DPI displays where button sizes may differ
3. **Zoom Levels**: Test with browser zoom (Ctrl +/-) to ensure no overflow
4. **Long Menu Labels**: Test with custom menu labels that may be longer in Arabic

## References

- [Electron BrowserWindow Documentation](https://www.electronjs.org/docs/latest/api/browser-window)
- [Electron Frameless Window Guide](https://www.electronjs.org/docs/latest/tutorial/window-customization)
- [CSS Direction Property (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/direction)
- [RTL Web Development Best Practices](https://www.w3.org/International/questions/qa-html-dir)
