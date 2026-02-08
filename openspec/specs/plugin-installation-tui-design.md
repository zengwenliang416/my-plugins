# Plugin Installation Interface TUI Design Specs

## 1. Component Enumeration [INFERRED]

### Layout Components
- **MainContainer**: Top-level wrapper managing global state (width: 100%, height: 100%).
- **Header**: App title and current section indicator.
- **Footer/ActionBar**: Sticky bottom bar displaying context-aware keyboard shortcuts (e.g., "ESC Back", "↵ Install").
- **ContentArea**: Scrollable/flex area for main views.

### Input & Navigation
- **SearchInput**: Text field with `🔍` prefix. Styles focus state.
- **TabNavigation**: Horizontal menu for switching views ("Browse", "Installed", "Updates").
- **Pagination**: "Page X of Y" or "Load More" indicator.

### List & Items
- **PluginList**: Vertical flex container.
- **PluginItemRow**: Selectable row component. Columns: Name, Short Desc, Status, Version.
- **PluginCard**: (Alternative/Detail) Boxed view for a single item.

### Detail & Content
- **PluginDetailView**:
    - **MetaSection**: Author, Version, License, Downloads.
    - **ReadmeSection**: Scrollable text area for description.
- **KeyValueRow**: Label (dim) + Value (bright).

### Feedback & Status
- **StatusBadge**: Indicator for state (Installed, Compatible, Error).
- **InstallProgressBar**: Visual bar `[████░░░░░░]` with percentage and step text.
- **Spinner**: Unicode spinner `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` for async operations.
- **Toast/Message**: Overlay or inline text for success/error notifications.

## 2. Visual Specifications (React Ink) [INFERRED]

### Borders & Spacing
- **Global Border Style**: `round` (using Unicode `╭─╮│╰─╯`) for main panels to feel modern; `single` for internal dividers.
- **Panel Padding**: `padding: 1` (1 char cell all around) for main content areas.
- **List Item Padding**: `paddingX: 1`, `paddingY: 0` (compact) or `paddingY: 1` (comfortable).
- **Gap**: `gap: 1` (1 column/row) between flex items.

### Sizing & Layout
- **Container Width**: `minWidth: 80` (standard terminal safety), `width: 100%` (responsive).
- **Search Input**: `width: 100%` or `width: 40` (centered).
- **Status Badge**: Fixed width (e.g., 12 chars) to align columns. `[  INSTALLED ]`.

### Selection State
- **Focused Item**:
    - Border: Color `blue` or `cyan`.
    - Text: `inverse` (Background Color swaps) or `> ` prefix.
- **Dimmed/Disabled**: `dimColor: true` (gray).

## 3. Typography System (Terminal Formatting) [INFERRED]

*Terminal does not support font families or sizes. Hierarchy is established via color, weight, and decoration.*

### Styles
- **Primary Color**: `cyan` (Brand/Action).
- **Secondary Color**: `blue` (Information).
- **Success Color**: `green`.
- **Warning/Error Color**: `yellow` / `red`.
- **Meta Color**: `gray` (dim).

### Hierarchy Levels

| Level | Usage | Ink / ANSI Formatting | Example |
| :--- | :--- | :--- | :--- |
| **Title** | App Header, Major Screen Titles | `bold`, `color="cyan"`, `textTransform="uppercase"` | **<u>PLUGIN STORE</u>** |
| **Heading** | Section Headers, Plugin Names | `bold`, `color="white"` | **React Refactor Tool** |
| **Subheading** | Property Keys, Tab Labels | `bold`, `dim` | **Version:** |
| **Body** | Descriptions, Readme text | `color="white"` (default) | Adds refactoring cap... |
| **Caption/Meta** | Author name, Dates, License | `dim` | by @facebook |
| **Code** | Package names, Commands | `color="magenta"` or `italic` | `npm install react` |
| **Status/Label** | Badges | `inverse`, `bold` | **[ INSTALLED ]** |
| **Action** | Keyboard shortcuts | `underline` or `color="green"` | <u>Enter</u> to Install |

## 4. Spacing & Visual Hierarchy System [INFERRED]

### Spacing Base Unit
- **Horizontal Unit**: `1ch` (1 character width).
- **Vertical Unit**: `1 line` (standard terminal line height).
- **Box Padding**: `paddingX: 1`, `paddingY: 0` for dense UI; `paddingY: 1` for modals/dialogs.
- **Section Margins**: `marginY: 1` between distinct logical blocks (e.g., Search Bar vs List).

### Padding & Margin Patterns
- **Container Internals**:
    - Bordered Box content: `paddingX: 1` (prevents text touching borders).
    - Modal Dialogs: `padding: 2` (creates whitespace "breath" around content).
- **List Items**:
    - Item Gap: `marginBottom: 0` (contiguous list) or `marginBottom: 1` (card style).
    - Nested Indentation: `marginLeft: 2` (visual hierarchy for dependencies or logs).
- **Separators**:
    - Horizontal Rule: `height: 1` (using `─` character) with `dim` color.
    - Vertical Divider: `width: 1` (using `│` character) with `paddingX: 1` around it.

### Visual Weight Distribution
- **Primary Emphasis (Bold + Color)**:
    - Active Selection: `color="cyan"`, `bold`.
    - Screen Titles: `bold`, `underline`.
- **Secondary Emphasis (Standard)**:
    - Body Text: `color="white"` (default intensity).
    - Input Fields: `color="white"`.
- **Tertiary Emphasis (Dim/Gray)**:
    - Metadata Labels: `dim`.
    - Inactive Menu Items: `dim`.
    - Borders: `dim` (unless focused).
- **Interactive Accents**:
    - Focus Ring: `borderColor="cyan"` vs `borderColor="gray"` (unfocused).
    - Progress Bar Filled: `color="green"`.

### Typography Rhythm
- **Line Spacing**:
    - Lists: Dense (single line spacing) for efficiency.
    - Detail Views: `lineHeight: 1.5` (simulated by 1 empty line every ~2-3 lines of text) for readability.
- **Truncation**:
    - Titles: `wrap="truncate-end"` with `...` (e.g., "Very Long Plugin Na...").
    - Descriptions: `wrap="truncate"` at 2 lines max in list view.
- **Alignment**:
    - General Text: `justifyContent="flex-start"` (Left aligned).
    - Numerical/Version Data: `justifyContent="flex-end"` (Right aligned) to align digits.
    - Width Constraint: `maxWidth: 80` for readable text blocks in full-screen terminals.

### Progress Screen Layout
- **Progress Bar**:
    - Width: `width: "100%"` (minus padding) or `width: 40` (centered modal).
    - Character: `█` (Full Block) for filled, `░` (Light Shade) for empty.
- **Status Message**:
    - Position: Immediately above progress bar.
    - Format: `justifyContent="space-between"` (Task Name ... 45%).
- **Log Area**:
    - Height: `height: 8` (fixed window).
    - Style: `borderStyle="single"`, `borderColor="gray"`.
    - Scroll: Auto-scroll to bottom.
- **Spinner**:
    - Position: Left of current task text.
    - Spacing: `marginRight: 1`.

## 4. Interaction States [INFERRED]

*States are expressed through ANSI formatting changes.*

### Components
- **PluginItemRow**:
    - **Default**: `color="white"`.
    - **Focused**: `backgroundColor="cyan"`, `color="black"` (inverse) OR prefix `>`.
    - **Disabled**: `color="gray"` (dim), non-selectable.
- **SearchInput**:
    - **Empty**: `color="gray"` text "Search plugins...".
    - **Focused**: `borderColor="cyan"`, blinking cursor `|`.
    - **Filled**: `color="white"`.
- **TabNavigation**:
    - **Active**: `color="cyan"`, `bold`, `underline`.
    - **Inactive**: `color="gray"`.
- **Button/Action**:
    - **Default**: Box border `gray`.
    - **Focused**: Box border `green`, text `bold`.
    - **Loading**: Replaces text with Spinner.
- **InstallProgressBar**:
    - **Idle**: Hidden.
    - **In-Progress**: `color="blue"`.
    - **Complete**: `color="green"`.
    - **Error**: `color="red"`.

## 5. Icon/Symbol System [INFERRED]

*Unicode symbols used for visual communication.*

### Library
- **Navigation**: `→` (Right), `←` (Left), `›` (Chevron), `▼` (Dropdown).
- **Status**:
    - Success: `✔` (Check) - Green.
    - Error: `✖` (Cross) - Red.
    - Warning: `⚠` (Warning) - Yellow.
    - Info: `ℹ` (Info) - Blue.
- **Actions**:
    - Install: `⬇` (Down Arrow) or `+`.
    - Uninstall: `🗑` (Trash) or `x`.
    - Update: `↻` (Refresh).
    - Search: `🔍` (Glass).
    - Secure: `🔒` (Lock).
- **Progress**:
    - Spinner: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` (Dots).
    - Bar: `█` (Full), `░` (Empty/Track), `▏▎▍▌▋▊▉` (Fractional).
- **Decorative**: `•` (Bullet), `│` (Vert Sep), `─` (Horz Sep).

## 6. Micro-interactions & Animation [INFERRED]

- **Spinner**: Frame rate `80ms`.
- **Progress Bar**: Update throttling `100ms` to prevent flicker. Smooth filling using fractional block characters if supported.
- **Transitions**: Instant replacement (no slide animations).
- **Loading States**: Use "Skeleton" rows (dimmed gray lines `────`) while fetching.

## 7. Component Variants [INFERRED]

- **PluginItemRow**:
    - **Compact**: Single line. `[Icon] Name (v1.0) ... [Status]`.
    - **Expanded**: Two lines. Name/Status on top, Description (dim) on bottom.
- **StatusBadge**:
    - **Minimal**: Icon only `✔`.
    - **Full**: Icon + Text `[ ✔ INSTALLED ]` (Inverse).
- **ProgressBar**:
    - **Inline**: Short (10-20 chars) in list.
    - **Full-Width**: Bottom docking or modal.
- **ActionBar**: Context-aware labels.
    - *Browse*: `ESC Back` `↑/↓ Nav` `↵ Detail`.
    - *Detail*: `I Install` `U Uninstall`.
