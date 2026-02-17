# TinyMCE AI Accessibility Fixer Plugin for Moodle

A TinyMCE editor plugin for Moodle that uses AI to automatically detect and fix accessibility issues in content, helping ensure WCAG compliance for your course materials.

## Description

The **tiny_a11yfix** plugin integrates with Moodle's TinyMCE editor to provide real-time accessibility checking and AI-powered automatic fixes for common accessibility issues. This plugin helps content creators ensure their materials are accessible to all learners by identifying and fixing issues such as missing alt text, weak link text, low contrast, missing form labels, and table accessibility problems.

## Features

### Real-time Monitoring
- **Auto-check with Debounce**: Automatically checks content for accessibility issues as you type, with a configurable debounce delay (default 2000ms) to avoid excessive API calls
- **Visual Status Indicators**: The toolbar button dynamically changes color based on accessibility status:
  - **Green** (#218838): No accessibility issues detected
  - **Red** (#dc3545): Accessibility issues found
- **Non-Intrusive**: Background checking runs silently without disrupting the editing experience

### Accessibility Analysis & Reporting
- **Detailed Accessibility Reports**: Opens a modal dialog with a comprehensive analysis of all issues found
- **Loading State**: Shows a spinner while analyzing content
- **Issue Categorization**: Groups issues by type for easy review

### AI-Powered Fixing
- **Suggested Fixes**: Get AI-generated suggestions for each issue with reasoning explanations
- **Editable Suggestions**: Review and modify AI suggestions before applying them
- **Fix Individual Issues**: Apply fixes one at a time for granular control
- **Fix All Issues**: Apply all suggested fixes sequentially with a single click
- **Image Analysis**: For missing alt text issues, images are automatically converted to base64 (resized to max 1024x1024, JPEG 80% quality) and sent to the AI for intelligent alt text generation

### Visual Navigation
- **"Show Me Where" Feature**: Highlights the problematic element in the content preview, making it easy to locate issues
- **Smooth Scrolling**: Automatically scrolls to highlighted elements for quick navigation

### Editor Integration
- **Toolbar Button**: Adds a "Fix Accessibility" button to the TinyMCE toolbar (in the "content" section)
- **Menu Item**: Also available in the TinyMCE "Tools" menu for alternative access

## Accessibility Issues Detected

The plugin can detect and help fix the following accessibility issues:

| Issue Type | Description |
|------------|-------------|
| `missing_alt_text` | Images without alternative text descriptions |
| `weak_link_text` | Links with non-descriptive text (e.g., "click here", "read more") |
| `contrast_issue` | Text with insufficient color contrast against its background |
| `missing_form_label` | Form inputs without associated labels |
| `table_missing_caption` | Tables without caption elements |
| `table_missing_headers` | Tables without proper header cells |
| `table_merged_cells` | Tables with merged cells that may cause accessibility issues |

## Requirements

- Moodle 5.1 or later (version 2025092600+)
- TinyMCE editor (Moodle's default editor)
- **aiplacement_a11y** plugin (version 2026021401 or later) - **Required dependency**

## Course-Level Control (Moodle 5.1+)

Starting with Moodle 5.1, this plugin respects the **Enable AI Tools** course setting, giving instructors granular control over AI-powered features.

### How It Works

The plugin visibility is controlled by the `enableaitools` course setting:

- **When `enableaitools` is enabled (true)**: 
  - The accessibility fixer button appears in the TinyMCE toolbar
  - The menu item is available in the Tools menu
  - All AI-powered accessibility features are fully functional

- **When `enableaitools` is disabled (false)**:
  - The plugin is completely hidden from the editor
  - No button or menu item is displayed
  - The plugin does not load or consume resources

### Configuring the Setting

Course administrators can control this setting per course:

1. Navigate to **Course administration > Edit settings**
2. Locate the **Enable AI Tools** setting
3. Check or uncheck the box to enable/disable AI tools for the course
4. Save the changes

This allows institutions to:
- Control AI tool usage at the course level
- Disable AI features in courses where they may not be appropriate
- Comply with institutional policies regarding AI usage
- Reduce cognitive load for instructors who prefer not to use AI features

### Default Behavior

If the `enableaitools` setting is not present or cannot be determined (e.g., in non-course contexts), the plugin defaults to **enabled** for backward compatibility.

## Installation

1. **Install the dependency first**: Ensure the **aiplacement_a11y** plugin is installed and configured

2. **Download and extract** the plugin to your Moodle installation:
   ```
   /path/to/moodle/lib/editor/tiny/plugins/a11yfix/
   ```

3. **Complete the installation** by logging in as an administrator and visiting:
   ```
   Site administration > Notifications
   ```

4. The plugin will be automatically enabled after installation

## Usage

### Getting Started

1. **Open any TinyMCE editor** in Moodle (course descriptions, page content, forum posts, etc.)

2. **Locate the accessibility button** in the toolbar - it shows the "Fix Accessibility" tooltip on hover

3. **Watch the button color** as you edit:
   - **Green icon**: Your content has no detected accessibility issues
   - **Red icon**: Accessibility issues have been found (tooltip shows count)

### Fixing Issues

1. **Click the accessibility button** to open the Accessibility Report modal

2. **Review the issues** listed in the report

3. **For each issue, you can**:
   - Click **"Suggest Fix"** to get an AI-generated suggestion with reasoning
   - Edit the suggestion in the textarea if needed
   - Click **"Fix Issue"** to apply the fix
   - Click **"Show Me Where"** to highlight the element in the preview

4. **Alternatively**, click **"Fix All"** to apply fixes to all issues automatically

5. **Click "Apply Changes"** to save the fixed content back to the editor

6. **Review the changes** in the editor to ensure they meet your needs

## Permissions

The plugin includes the following capability:

| Capability | Description | Default |
|------------|-------------|---------|
| `tiny/a11yfix:use` | Allows users to use the AI Accessibility Fixer | Granted to all authenticated users |

## Configuration

The plugin works automatically once installed. Configuration options are managed through the **aiplacement_a11y** plugin, including:

- Auto-check debounce delay (controls how long to wait after typing before checking)
- AI provider settings

## Technical Details

### API Integration

The plugin communicates with the aiplacement_a11y API using the following external functions:

- `aiplacement_a11y_analyze_only`: Quick check for accessibility issues (used for status indicator)
- `aiplacement_a11y_fix_accessibility`: Full analysis with detailed report
- `aiplacement_a11y_get_suggestion`: Get AI suggestion for a specific issue
- `aiplacement_a11y_fix_single_issue`: Apply AI fix to a single issue
- `aiplacement_a11y_get_settings`: Retrieve plugin settings (e.g., debounce delay)

### File Structure

```
a11yfix/
├── amd/
│   ├── build/          # Compiled JavaScript (minified)
│   └── src/
│       ├── commands.js     # Main functionality and UI logic
│       ├── common.js       # Shared constants
│       ├── configuration.js # TinyMCE toolbar/menu configuration
│       ├── options.js      # Editor options registration
│       └── plugin.js       # Plugin entry point
├── classes/
│   ├── plugininfo.php      # Plugin metadata and configuration
│   └── privacy/
│       └── provider.php    # Privacy API implementation
├── db/
│   └── access.php          # Capability definitions
├── lang/
│   └── en/
│       └── tiny_a11yfix.php # Language strings
├── pix/
│   └── icon.svg            # Plugin icon
├── LICENSE
├── README.md
├── styles.css              # Button status styling
└── version.php             # Version and dependencies
```

## Privacy

This plugin does not store any personal data. All accessibility analysis is performed on-demand through the aiplacement_a11y API and is not logged by this plugin. See the privacy provider implementation for details.

## Author

**Patrick Thibaudeau**  
York University  
© 2026

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Moodle. If not, see <http://www.gnu.org/licenses/>.

## Version Information

| Property | Value |
|----------|-------|
| **Current Version** | v0.2-alpha |
| **Plugin Version** | 2026021413 |
| **Maturity** | Alpha |
| **Requires Moodle** | 5.1+ (2025092600) |
| **Requires aiplacement_a11y** | 2026021401+ |

## Support

For bug reports, feature requests, or questions, please contact the plugin maintainer or your Moodle administrator.

## Changelog

### v0.2-alpha (February 2026)
- Added support for Moodle 5.1 `enableaitools` course setting
- Plugin now respects course-level AI tools control
- Plugin is hidden when AI tools are disabled at the course level
- Added auto-check functionality with configurable debounce
- Added visual status indicators (green/red button colors)
- Added "Show Me Where" feature for issue highlighting
- Added suggested fix editing capability
- Improved image handling with resizing and compression for AI analysis
- Modal-based accessibility report with tabbed views

## Acknowledgments

This plugin leverages AI technology through the **aiplacement_a11y** placement to provide intelligent accessibility checking and fixing capabilities. The AI integration enables context-aware fixes, including intelligent alt text generation based on image content analysis.
