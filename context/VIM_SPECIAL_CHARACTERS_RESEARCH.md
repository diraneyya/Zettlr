# Vim Special Characters Research - Complete Analysis

**Date**: 2025-11-16
**Status**: Research Complete - Ready for Implementation

## Executive Summary

This document provides an exhaustive analysis of all Vim Normal mode commands that use special characters and may require helper key combination assignments for non-Latin keyboards (particularly Arabic/RTL layouts).

**Current Implementation** supports 13 characters:
`{ } [ ] ( ) @ # $ % ^ & *`

**Recommended Additions**: 29 additional characters identified
**Total Characters Needed**: 42 characters for comprehensive Vim support

## Methodology

Research conducted through:
- Official Vim documentation (vim.rtorr.com, vimdoc.sourceforge.net)
- Vim Reference Guides (learnbyexample.github.io)
- Stack Exchange Vi/Vim community
- Web searches for specific command categories

## Current Implementation Analysis

### Currently Supported (13 characters)

| Character | Vim Command | Description |
|-----------|-------------|-------------|
| `{` | `{` | Jump to previous paragraph/block |
| `}` | `}` | Jump to next paragraph/block |
| `[` | `[` + motion | Various commands (e.g., `[[`, `[{`, `[(`) |
| `]` | `]` + motion | Various commands (e.g., `]]`, `]{`, `](`) |
| `(` | `(` | Jump to previous sentence |
| `)` | `)` | Jump to next sentence |
| `@` | `@{register}` | Execute macro from register |
| `#` | `#` | Search backward for word under cursor |
| `$` | `$` | Jump to end of line |
| `%` | `%` | Jump to matching bracket/brace/paren |
| `^` | `^` | Jump to first non-blank character |
| `&` | `&` | Repeat last substitute (`:s`) |
| `*` | `*` | Search forward for word under cursor |

**Source**: `/Users/orwa/repos/Zettlr-official/source/common/modules/markdown-editor/util/configuration.ts:167`

```typescript
const vimChars = ['{', '}', '[', ']', '(', ')', '@', '#', '$', '%', '^', '&', '*']
```

## Missing Critical Commands

### Category 1: Search & Navigation (7 characters)

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `/` | `/pattern` | Search forward | **HIGH** | Required for any search |
| `?` | `?pattern` | Search backward | **HIGH** | Required for backward search |
| `;` | `;` | Repeat last f/t/F/T forward | **HIGH** | Common navigation |
| `,` | `,` | Repeat last f/t/F/T backward | **HIGH** | Common navigation |
| `` ` `` | `` `{mark} `` | Jump to exact mark position | MEDIUM | Advanced navigation |
| `'` | `'{mark}` | Jump to mark line start | MEDIUM | Advanced navigation |
| `\|` | `{n}\|` | Jump to column n | LOW | Column positioning |

**Rationale**: `/` and `?` are absolutely essential for search functionality. `;` and `,` are commonly used for character-based navigation with `f/t/F/T`.

### Category 2: Text Objects & Operators (6 characters)

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `"` | `"{register}` | Use named register | **HIGH** | Register access |
| `<` | `<{motion}` | Shift text left (operator) | **HIGH** | Indentation |
| `>` | `>{motion}` | Shift text right (operator) | **HIGH** | Indentation |
| `=` | `={motion}` | Auto-indent (operator) | **HIGH** | Code formatting |
| `~` | `~` | Toggle case | MEDIUM | Text transformation |
| `!` | `!{motion}{filter}` | Filter through external program | LOW | Advanced editing |

**Rationale**: `<>` and `=` are essential for code editing. `"` is critical for register operations (copy/paste to named registers).

### Category 3: Line-wise Commands (4 characters)

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `_` | `_` | Move to first non-blank of line (like `^`) | LOW | Alternative to `^` |
| `-` | `-` | Move to first non-blank of previous line | MEDIUM | Line navigation |
| `+` | `+` | Move to first non-blank of next line | MEDIUM | Line navigation |
| `0` | `0` | Jump to start of line | **HIGH** | Common navigation |

**Rationale**: `0` is extremely common and essential. `-/+` are useful for line-wise movement.

### Category 4: Command Mode Entry (2 characters)

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `:` | `:` | Enter command-line mode | **CRITICAL** | Required for ALL ex commands |
| `.` | `.` | Repeat last change | **CRITICAL** | Most powerful Vim command |

**Rationale**: `:` is ABSOLUTELY ESSENTIAL for ex commands (`:w`, `:q`, etc.). `.` is one of Vim's most powerful features.

### Category 5: Text Object Delimiters (4 characters)

These are used with `i` (inner) and `a` (around) text objects:

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `` ` `` | `i` `a` `` ` `` | Backtick text object | LOW | Markdown/code |
| `'` | `i'` `a'` | Single quote text object | MEDIUM | String editing |
| `"` | `i"` `a"` | Double quote text object | MEDIUM | String editing |
| `<` | `i<` `a<` | Angle bracket text object | LOW | HTML/XML editing |
| `>` | (same as `<`) | (same as `<`) | LOW | HTML/XML editing |

**Note**: `"`, `<`, `>` already listed in Category 2. Quote text objects are important for string manipulation.

### Category 6: Special Operations (6 characters)

| Character | Vim Command | Description | Priority | Keyboard Context |
|-----------|-------------|-------------|----------|------------------|
| `g` + special | Various | Gateway to extended commands | N/A | Modifier key (letter) |
| `Z` + special | `ZZ`, `ZQ` | Save/quit commands | N/A | Modifier key (letter) |
| `\\` | `\\{motion}` | Plugin-specific or custom | LOW | Custom mappings |
| `\|` | `\|` (or in cmd) | Command separator (cmd mode) | LOW | Command chaining |

**Note**: Backslash typically used for leader key or custom mappings, not core Vim.

## Comprehensive Character List

### Recommended Implementation (42 Total Characters)

#### Tier 1: CRITICAL (Must Have) - 9 characters
```
: . / ? 0 " < > =
```
**Justification**: Essential for basic Vim functionality (commands, search, indentation, registers).

#### Tier 2: HIGH Priority (Should Have) - 13 characters
```
; , - + * # $ % ^ & { } [ ]
```
**Justification**: Common navigation, search, and motion commands. Currently implemented: `* # $ % ^ & { } [ ]`

**New additions from this tier**: `; , - +`

#### Tier 3: MEDIUM Priority (Nice to Have) - 11 characters
```
( ) @ ~ ' ` ! _ | -
```
**Justification**: Text objects, macros, marks, case toggling. Currently implemented: `( ) @`

**New additions from this tier**: `~ ' `` ` `` ! _ |`

Note: `-` appears in both Tier 2 and 3 (already counted in Tier 2)

#### Tier 4: LOW Priority (Advanced Users) - 4 characters
```
\ + (others context-dependent)
```
**Justification**: Custom mappings, advanced features.

### Complete Sorted List by Priority

```typescript
// TIER 1: CRITICAL - Must implement (5 new + 4 existing)
['.', ':', '/', '?', '"', '<', '>', '=', '0']

// TIER 2: HIGH - Already implemented (10) + New (4)
// Already have: * # $ % ^ & { } [ ]
// Need to add: ; , - +
[';', ',', '-', '+']

// TIER 3: MEDIUM - Already implemented (3) + New (6)
// Already have: ( ) @
// Need to add: ~ ' ` ! _ |
['~', "'", '`', '!', '_', '|']

// TIER 4: LOW - Advanced/optional
['\\']
```

## Implementation Recommendations

### Phase 1: Critical Characters (Immediate)
Add these 9 characters immediately:
```
. : / ? 0 " < > =
```

**Impact**: Enables essential Vim workflows (searching, commanding, indenting, registers).

### Phase 2: High Priority (Next)
Add these 4 characters:
```
; , - +
```

**Impact**: Enhances navigation and line-wise operations.

### Phase 3: Medium Priority (Soon)
Add these 6 characters:
```
~ ' ` ! _ |
```

**Impact**: Enables advanced text manipulation and marks.

### Phase 4: Low Priority (Later/Optional)
Add if users request:
```
\
```

**Impact**: Custom mappings support.

## Updated Code Changes Required

### 1. Update `getDefaultVimKeyMappings()` Function

**File**: `source/common/modules/markdown-editor/util/configuration.ts:165-184`

**Current**:
```typescript
export function getDefaultVimKeyMappings (): Record<string, KeyMapping> {
  const vimChars = ['{', '}', '[', ']', '(', ')', '@', '#', '$', '%', '^', '&', '*']
  // ... rest of implementation
}
```

**Recommended (Phase 1 - All Tiers)**:
```typescript
export function getDefaultVimKeyMappings (): Record<string, KeyMapping> {
  // All characters organized by tier for clarity
  const vimChars = [
    // Tier 1: CRITICAL
    '.', ':', '/', '?', '0', '"', '<', '>', '=',
    // Tier 2: HIGH (existing + new)
    '{', '}', '[', ']', '(', ')', '@', '#', '$', '%', '^', '&', '*',
    ';', ',', '-', '+',
    // Tier 3: MEDIUM
    '~', "'", '`', '!', '_', '|',
    // Tier 4: LOW (optional)
    '\\'
  ]
  // ... rest of implementation
}
```

**Recommended (Phase 1 - Critical Only)**:
```typescript
export function getDefaultVimKeyMappings (): Record<string, KeyMapping> {
  const vimChars = [
    // Phase 1: CRITICAL additions
    '.', ':', '/', '?', '0', '"', '<', '>', '=',
    // Existing implementation
    '{', '}', '[', ']', '(', ')', '@', '#', '$', '%', '^', '&', '*'
  ]
  // ... rest of implementation
}
```

### 2. Update `getDefaultVimKeyMappings()` in Config Template

**File**: `source/app/service-providers/config/get-config-template.ts:445-464`

Apply same changes as above (duplicate function exists).

### 3. No Changes Required for Training UI

**File**: `source/common/vue/form/elements/VimKeyMappingTrainer.vue`

No changes needed! The component dynamically renders all characters from the config, so adding characters to the config will automatically add them to the UI.

## Special Considerations

### 1. Backslash Character

The backslash (`\`) is tricky:
- Used as leader key in many Vim configs
- May conflict with keyboard layouts
- Consider making it optional or documenting caveats

### 2. Quote Characters

Both `'` and `"` serve dual purposes:
- `"` for registers AND text objects
- `'` for marks AND text objects

The training UI should clarify this in tooltips.

### 3. Angle Brackets

`<` and `>` are both:
- Operators (indent left/right)
- Text object delimiters

Single mapping works for both use cases.

### 4. Command Mode Entry

`:` is CRITICAL - without it, users cannot save/quit/run commands. This should be highest priority.

### 5. Repeat Command

`.` is one of Vim's most powerful commands - extremely high priority.

## Testing Checklist

After implementation, verify each character works:

### Tier 1: Critical
- [ ] `.` - Repeat last change
- [ ] `:` - Enter command mode (`:w`, `:q`, etc.)
- [ ] `/` - Forward search
- [ ] `?` - Backward search
- [ ] `0` - Jump to line start
- [ ] `"` - Named register access (`"ay`, `"ap`)
- [ ] `<` - Shift left (`<<`, `<j`)
- [ ] `>` - Shift right (`>>`, `>j`)
- [ ] `=` - Auto-indent (`==`, `=G`)

### Tier 2: High Priority (New)
- [ ] `;` - Repeat f/t forward
- [ ] `,` - Repeat f/t backward
- [ ] `-` - Move to previous line (first non-blank)
- [ ] `+` - Move to next line (first non-blank)

### Tier 3: Medium Priority
- [ ] `~` - Toggle case
- [ ] `'` - Jump to mark line (`'a`)
- [ ] `` ` `` - Jump to mark exact (```` `a ````)
- [ ] `!` - Filter through external command
- [ ] `_` - First non-blank character (like `^`)
- [ ] `|` - Jump to column

### Tier 2: High Priority (Existing)
- [ ] `{` - Previous paragraph
- [ ] `}` - Next paragraph
- [ ] `[` - Various bracket commands
- [ ] `]` - Various bracket commands
- [ ] `(` - Previous sentence
- [ ] `)` - Next sentence
- [ ] `@` - Execute macro
- [ ] `#` - Search word backward
- [ ] `$` - End of line
- [ ] `%` - Matching bracket
- [ ] `^` - First non-blank
- [ ] `&` - Repeat substitute
- [ ] `*` - Search word forward

## UI/UX Recommendations

### 1. Grouping in Training UI

Group characters by category for better UX:

```
Search & Navigation:    / ? * # ; ,
Line Operations:        0 $ ^ _ - +
Text Objects:           " ' ` ( ) [ ] { } < >
Operators:              < > = ~
Advanced:               @ % & | !
Special:                . :
```

### 2. Tooltips/Help Text

Add descriptions next to each character:
```
/ - Search forward
? - Search backward
. - Repeat last change
: - Enter command mode
```

### 3. Visual Priority Indicators

Mark critical characters with visual indicators:
- 🔴 Critical: `. : / ? 0 " < > =`
- 🟡 High: `;, - + * # $ % ^ & { } [ ]`
- 🟢 Medium: `~ ' `` ` `` ! _ | ( ) @`

## Translation Keys Required

Add to `static/lang/ar-AR.po`:

```po
# Vim character descriptions
msgid "vim.char.dot"
msgstr "تكرار آخر تغيير"

msgid "vim.char.colon"
msgstr "وضع الأوامر"

msgid "vim.char.slash"
msgstr "بحث للأمام"

msgid "vim.char.question"
msgstr "بحث للخلف"

msgid "vim.char.zero"
msgstr "بداية السطر"

msgid "vim.char.quote.double"
msgstr "السجلات المسماة"

msgid "vim.char.less"
msgstr "إزاحة لليسار"

msgid "vim.char.greater"
msgstr "إزاحة لليمين"

msgid "vim.char.equals"
msgstr "ضبط المحاذاة تلقائياً"

msgid "vim.char.semicolon"
msgstr "تكرار f/t للأمام"

msgid "vim.char.comma"
msgstr "تكرار f/t للخلف"

msgid "vim.char.minus"
msgstr "السطر السابق"

msgid "vim.char.plus"
msgstr "السطر التالي"

msgid "vim.char.tilde"
msgstr "تبديل حالة الأحرف"

msgid "vim.char.quote.single"
msgstr "علامة السطر"

msgid "vim.char.backtick"
msgstr "علامة الموضع الدقيق"

msgid "vim.char.exclamation"
msgstr "تصفية عبر أمر خارجي"

msgid "vim.char.underscore"
msgstr "أول حرف غير فارغ"

msgid "vim.char.pipe"
msgstr "الانتقال للعمود"
```

## Summary Statistics

| Category | Count | Examples |
|----------|-------|----------|
| **Currently Implemented** | 13 | `{ } [ ] ( ) @ # $ % ^ & *` |
| **Tier 1 (Critical) - NEW** | 9 | `. : / ? 0 " < > =` |
| **Tier 2 (High) - NEW** | 4 | `; , - +` |
| **Tier 3 (Medium) - NEW** | 6 | `~ ' `` ` `` ! _ \|` |
| **Tier 4 (Low) - NEW** | 1 | `\` |
| **TOTAL NEW** | 20 | |
| **TOTAL ALL TIERS** | 33 | |

**Recommended Immediate Action**: Implement Tier 1 (9 characters) to enable essential Vim functionality.

## References

- [Vim Cheat Sheet](https://vim.rtorr.com/)
- [Vim Normal Mode Reference](https://learnbyexample.github.io/vim_reference/Normal-mode.html)
- [Vim Text Objects](https://mkaz.blog/working-with-vim/text-objects)
- [Vim Operator-Pending Mode](https://vimandgit.com/posts/vim/beginners/vim-normal-mode-commands-and-operator-pending-mode.html)

---

**Last Updated**: 2025-11-16
**Next Steps**:
1. Review with team
2. Prioritize tiers
3. Implement Phase 1 (Critical)
4. Test thoroughly
5. Document in user guide
