# TinyMCE AI Accessibility Fixer Plugin for Moodle

A TinyMCE editor plugin for Moodle that uses AI to automatically detect and fix accessibility issues in content, helping ensure WCAG compliance for your course materials.

## Description

The **tiny_a11yfix** plugin integrates with Moodle's TinyMCE editor to provide real-time accessibility checking and AI-powered automatic fixes for common accessibility issues. This plugin helps content creators ensure their materials are accessible to all learners by identifying and fixing issues such as missing alt text, improper heading structure, low contrast, and other WCAG violations.

## Features

- **Real-time Accessibility Monitoring**: Automatically checks content for accessibility issues as you type
- **Visual Status Indicators**: Button changes color to indicate when accessibility issues are detected
- **AI-Powered Fixes**: Uses AI to analyze and fix accessibility problems automatically
- **Detailed Accessibility Reports**: Shows a comprehensive list of issues found in your content
- **One-Click Fixes**: Apply all suggested fixes with a single click
- **Issue Tracking**: Visual indicators show which issues have been fixed
- **Non-Intrusive**: Automatically checks content in the background without disrupting editing

## Requirements

- Moodle 4.5 or later (requires: 2025092600)
- TinyMCE editor
- **aiplacement_a11y** plugin (version 2026021401 or later) - This is a required dependency

## Installation

1. Download the plugin and extract it to your Moodle installation:
   ```
   /path/to/moodle/lib/editor/tiny/plugins/a11yfix/
   ```

2. Ensure the required **aiplacement_a11y** plugin is installed first

3. Log in as an administrator and visit the notifications page to complete the installation:
   ```
   Site administration > Notifications
   ```

4. The plugin will be installed automatically

## Usage

### For Content Creators

1. **Edit any content** in Moodle using the TinyMCE editor (e.g., course descriptions, page content, forum posts)

2. **Look for the accessibility button** in the TinyMCE toolbar (labeled "Fix Accessibility")

3. **Monitor the button status**:
   - Normal state: No issues detected
   - Warning state (red): Accessibility issues found

4. **Click the button** to:
   - View a detailed report of all accessibility issues
   - See AI-powered suggestions for fixes
   - Apply all fixes automatically with the "Apply Changes" button

5. **Review the changes**: After applying fixes, review the updated content to ensure it meets your needs

### Common Issues Detected

The plugin can detect and fix various accessibility issues, including:
- Missing alternative text for images
- Improper heading structure
- Insufficient color contrast
- Missing form labels
- Empty links or buttons
- Missing table headers
- And many other WCAG violations

## Permissions

The plugin includes the following capability:

- `tiny/a11yfix:use` - Allows users to use the AI Accessibility Fixer

By default, this capability is granted to all authenticated users.

## Configuration

The plugin is configured automatically when enabled. No additional settings are required.

The plugin communicates with the **aiplacement_a11y** API to analyze content and generate fixes.

## Privacy

This plugin does not store any personal data. All accessibility analysis is performed on-demand and not logged permanently. See the privacy provider for more details.

## Author

**Patrick Thibaudeau**  
York University  
© 2026

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Moodle. If not, see <http://www.gnu.org/licenses/>.

## Version Information

- **Current Version**: v0.2-alpha
- **Maturity**: Alpha
- **Release Date**: February 2026

## Support

For bug reports, feature requests, or questions, please contact the plugin maintainer or your Moodle administrator.

## Acknowledgments

This plugin leverages AI technology through the aiplacement_a11y placement to provide intelligent accessibility checking and fixing capabilities.
