// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

import {get_string as getString} from 'core/str';
import {call as fetchMany} from 'core/ajax';
import {alert as notificationAlert} from 'core/notification';
import Modal from 'core/modal';
import {
    component,
    buttonName,
    icon,
} from './common';
import {getContextId} from './options';


/**
 * Tiny a11yfix commands.
 *
 * @module      tiny_a11yfix/commands
 * @copyright   2026 Patrick Thibaudeau, York University
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @author      Patrick Thibaudeau
 */

// Global state for tracking issues and fixes
let currentIssues = [];
let currentHtmlContent = '';
let fixedIssues = new Set();
let modalInstance = null;
let debounceTimer = null;
let debounceDelay = 2000;
let currentButton = null;
let lastCheckedContent = '';

/**
 * Build the loading state HTML for the modal.
 *
 * @returns {string} The HTML content for the loading state.
 */
const buildLoadingBody = async() => {
    const loadingMessage = await getString('analyzingmodal', component);
    let html = '<div class="a11yfix-loading text-center py-5">';
    html += '<div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">';
    html += '<span class="sr-only">Loading...</span>';
    html += '</div>';
    html += '<p class="lead">' + loadingMessage + '</p>';
    html += '</div>';
    return html;
};

/**
 * Check accessibility and update button status.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const checkAccessibilityStatus = async(editor) => {
    const htmlContent = editor.getContent();

    // Skip if content is empty or hasn't changed.
    if (!htmlContent.trim() || htmlContent === lastCheckedContent) {
        return;
    }

    lastCheckedContent = htmlContent;

    try {
        const contextId = getContextId(editor);
        const request = {
            methodname: 'aiplacement_a11y_analyze_only',
            args: {
                contextid: contextId,
                htmlcontent: htmlContent,
            }
        };

        const response = await fetchMany([request])[0];

        if (response.success) {
            updateButtonStatus(editor, response.has_issues, response.issues_count);
        }
    } catch (err) {
        // Silently fail - don't disrupt editing.
        // eslint-disable-next-line no-console
        console.error('Auto-check failed:', err);
    }
};

/**
 * Update button appearance based on accessibility status.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 * @param {Boolean} hasIssues Whether issues were found.
 * @param {Number} issuesCount Number of issues.
 */
const updateButtonStatus = async(editor, hasIssues, issuesCount) => {
    // Get the editor's textarea element ID
    const editorId = editor.id;

    // Find the editor container first
    const editorContainer = editor.getContainer();

    if (!editorContainer) {
        // eslint-disable-next-line no-console
        console.error('Editor container not found for editor:', editorId);
        return;
    }

    // Find the button element within this editor's container
    const buttonElement = editorContainer.querySelector('button[data-mce-name="a11yfix_button"]');

    // eslint-disable-next-line no-console
    console.log('updateButtonStatus called:', {editorId, hasIssues, issuesCount, buttonElement});

    if (!buttonElement) {
        // eslint-disable-next-line no-console
        console.error('Button not found for editor:', editorId);
        return;
    }

    // Find the SVG path element.
    const svgPath = buttonElement.querySelector('svg path');

    if (!svgPath) {
        // eslint-disable-next-line no-console
        console.error('SVG path not found!');
        return;
    }

    // Update SVG path fill color directly via inline style.
    if (hasIssues) {
        svgPath.style.fill = '#dc3545'; // Red
        buttonElement.classList.add('a11yfix-has-issues');
        buttonElement.classList.remove('a11yfix-no-issues');

        // eslint-disable-next-line no-console
        console.log('Set RED color. SVG path fill:', svgPath.style.fill);

        // Update tooltip.
        const tooltip = await getString('accessibilityissues', 'aiplacement_a11y', issuesCount);
        buttonElement.setAttribute('title', tooltip);
        buttonElement.setAttribute('aria-label', tooltip);
    } else {
        svgPath.style.fill = '#28a745'; // Green
        buttonElement.classList.add('a11yfix-no-issues');
        buttonElement.classList.remove('a11yfix-has-issues');

        // eslint-disable-next-line no-console
        console.log('Set GREEN color. SVG path fill:', svgPath.style.fill);

        // Update tooltip.
        const tooltip = await getString('accessibilityok', 'aiplacement_a11y');
        buttonElement.setAttribute('title', tooltip);
        buttonElement.setAttribute('aria-label', tooltip);
    }
};

/**
 * Setup auto-check with debounce.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const setupAutoCheck = async(editor) => {
    // Get settings from server.
    try {
        const settings = await fetchMany([{
            methodname: 'aiplacement_a11y_get_settings',
            args: {}
        }])[0];

        debounceDelay = settings.autocheck_debounce || 2000;
    } catch (err) {
        // Use default if settings fetch fails.
        debounceDelay = 2000;
    }

    // If delay is 0, auto-check is disabled.
    if (debounceDelay === 0) {
        return;
    }

    // Initial check on load.
    setTimeout(() => {
        checkAccessibilityStatus(editor);
    }, 500);

    // Listen for content changes.
    editor.on('change keyup paste', () => {
        // Clear existing timer.
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Set new timer.
        debounceTimer = setTimeout(() => {
            checkAccessibilityStatus(editor);
        }, debounceDelay);
    });
};

/**
 * Fix accessibility issues in the editor content.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const fixAccessibility = async(editor) => {
    const htmlContent = editor.getContent();

    if (!htmlContent.trim()) {
        notificationAlert(
            await getString('pluginname', component),
            await getString('nocontenttofix', component)
        );
        return;
    }

    // Create and show modal immediately with loading state.
    const modal = await Modal.create({
        title: await getString('accessibilityreport', component),
        body: await buildLoadingBody(),
        footer: '<div></div>',
        large: true,
        removeOnClose: true,
        show: true,
    });

    // Make the modal extra-large.
    const $root = await modal.getRoot();
    const modalDialog = $root[0].querySelector('.modal-dialog');
    if (modalDialog) {
        modalDialog.classList.add('modal-xl');
    }

    try {
        const contextId = getContextId(editor);
        const request = {
            methodname: 'aiplacement_a11y_fix_accessibility',
            args: {
                contextid: contextId,
                htmlcontent: htmlContent,
            }
        };

        const response = await fetchMany([request])[0];

        if (!response.success) {
            // Update modal to show error.
            await updateModalWithError(modal, await getString('fixfailed', component));
            return;
        }

        if (!response.has_issues) {
            // Update modal to show no issues found.
            await updateModalWithNoIssues(modal);
            return;
        }

        // Update modal with results.
        await updateModalWithResults(modal, editor, response);

    } catch (error) {
        // Update modal to show error.
        await updateModalWithError(modal, error.message || 'An unexpected error occurred.');
    }
};

/**
 * Update modal with the accessibility fix results.
 *
 * @param {Object} modal The modal instance.
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 * @param {Object} response The response from the accessibility fix service.
 */
const updateModalWithResults = async(modal, editor, response) => {
    const applyText = await getString('applychanges', 'aiplacement_a11y');
    const cancelText = await getString('cancel', 'core');

    // Initialize global state
    currentHtmlContent = response.original_content;
    currentIssues = JSON.parse(response.issues_data || '[]');
    fixedIssues = new Set();
    modalInstance = modal;

    // Update modal body and footer.
    const $root = await modal.getRoot();
    const root = $root[0];

    // Update body.
    const bodyElement = root.querySelector('.modal-body');
    if (bodyElement) {
        bodyElement.innerHTML = buildModalBody(response);
    }

    // Setup fix button listeners after content is loaded
    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
        setupFixButtonListeners(editor, root);
    }, 100);

    // Update footer - create it if it doesn't exist.
    let footerElement = root.querySelector('.modal-footer');
    if (!footerElement) {
        // Footer doesn't exist, create it.
        const modalContent = root.querySelector('.modal-content');
        if (modalContent) {
            footerElement = document.createElement('div');
            footerElement.className = 'modal-footer';
            modalContent.appendChild(footerElement);
        }
    }

    if (footerElement) {
        footerElement.innerHTML = '<button type="button" class="btn btn-primary" data-action="apply">' + applyText + '</button>' +
                '<button type="button" class="btn btn-secondary" data-action="cancel">' + cancelText + '</button>';
    }

    // Add event listeners.
    root.addEventListener('click', (e) => {
        const applyAction = e.target.closest('[data-action="apply"]');
        const cancelAction = e.target.closest('[data-action="cancel"]');

        if (applyAction) {
            e.preventDefault();
            // Apply the current HTML content (with any fixes that were applied)
            editor.setContent(currentHtmlContent);
            editor.undoManager.add();
            modal.destroy();
        }

        if (cancelAction) {
            e.preventDefault();
            modal.destroy();
        }
    });
};

/**
 * Update modal to show no accessibility issues found.
 *
 * @param {Object} modal The modal instance.
 */
const updateModalWithNoIssues = async(modal) => {
    const okText = await getString('ok', 'core');
    const message = await getString('noaccessibilityissues', component);

    const $root = await modal.getRoot();
    const root = $root[0];

    // Update body.
    const bodyElement = root.querySelector('.modal-body');
    if (bodyElement) {
        bodyElement.innerHTML = '<div class="alert alert-success">' + message + '</div>';
    }

    // Update footer - create it if it doesn't exist.
    let footerElement = root.querySelector('.modal-footer');
    if (!footerElement) {
        // Footer doesn't exist, create it.
        const modalContent = root.querySelector('.modal-content');
        if (modalContent) {
            footerElement = document.createElement('div');
            footerElement.className = 'modal-footer';
            modalContent.appendChild(footerElement);
        }
    }

    if (footerElement) {
        footerElement.innerHTML = '<button type="button" class="btn btn-primary" data-action="close">' + okText + '</button>';
    }

    // Add event listener.
    root.addEventListener('click', (e) => {
        const closeAction = e.target.closest('[data-action="close"]');
        if (closeAction) {
            e.preventDefault();
            modal.destroy();
        }
    });
};

/**
 * Update modal to show an error message.
 *
 * @param {Object} modal The modal instance.
 * @param {string} errorMessage The error message to display.
 */
const updateModalWithError = async(modal, errorMessage) => {
    const okText = await getString('ok', 'core');

    const $root = await modal.getRoot();
    const root = $root[0];

    // Update body.
    const bodyElement = root.querySelector('.modal-body');
    if (bodyElement) {
        bodyElement.innerHTML = '<div class="alert alert-danger">' + errorMessage + '</div>';
    }

    // Update footer - create it if it doesn't exist.
    let footerElement = root.querySelector('.modal-footer');
    if (!footerElement) {
        // Footer doesn't exist, create it.
        const modalContent = root.querySelector('.modal-content');
        if (modalContent) {
            footerElement = document.createElement('div');
            footerElement.className = 'modal-footer';
            modalContent.appendChild(footerElement);
        }
    }

    if (footerElement) {
        footerElement.innerHTML = '<button type="button" class="btn btn-primary" data-action="close">' + okText + '</button>';
    }

    // Add event listener.
    root.addEventListener('click', (e) => {
        const closeAction = e.target.closest('[data-action="close"]');
        if (closeAction) {
            e.preventDefault();
            modal.destroy();
        }
    });
};

/**
 * Convert an image element to base64 data URI.
 * Resizes to max 1024x1024 and compresses as JPEG to reduce payload size.
 *
 * @param {string} imgSrc The image source URL.
 * @returns {Promise<string|null>} Base64 data URI or null if failed.
 */
const getImageAsBase64 = async(imgSrc) => {
    return new Promise((resolve) => {
        try {
            // Create a new image element.
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Try to handle CORS.

            img.onload = () => {
                try {
                    // Calculate resize dimensions (max 1024x1024, maintain aspect ratio).
                    const maxSize = 1024;
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;

                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }

                    // Create canvas with resized dimensions.
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to JPEG with 80% quality for smaller file size.
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataURL);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Error converting image to base64:', err);
                    resolve(null);
                }
            };

            img.onerror = () => {
                // eslint-disable-next-line no-console
                console.error('Error loading image:', imgSrc);
                resolve(null);
            };

            img.src = imgSrc;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error in getImageAsBase64:', err);
            resolve(null);
        }
    });
};

/**
 * Get AI suggestion for fixing an issue.
 *
 * @param {Number} issueIndex The index of the issue.
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const getSuggestedFix = async(issueIndex, editor) => {
    const issue = currentIssues[issueIndex];
    if (!issue) {
        return;
    }

    // Find the suggestion panel for this issue.
    const suggestionPanel = document.querySelector(`.suggestion-panel[data-issue-index="${issueIndex}"]`);
    if (!suggestionPanel) {
        return;
    }

    // If already visible, just toggle it.
    if (suggestionPanel.style.display !== 'none') {
        suggestionPanel.style.display = 'none';
        return;
    }

    // Show loading state in button.
    const issueElement = document.querySelector(`[data-issue-index="${issueIndex}"]`);
    const btn = issueElement?.querySelector('.suggest-fix-btn');
    if (btn) {
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = await getString('gettingsuggestion', 'aiplacement_a11y');
    }

    try {
        const contextId = getContextId(editor);

        // Prepare request arguments.
        const args = {
            contextid: contextId,
            htmlcontent: currentHtmlContent,
            issuetype: issue.type,
            issuedata: JSON.stringify(issue),
            imagedata: '',
        };

        // For image issues, convert image to base64.
        if (issue.type === 'missing_alt_text' && issue.src) {
            const imageBase64 = await getImageAsBase64(issue.src);
            if (imageBase64) {
                args.imagedata = imageBase64;
            }
        }

        const request = {
            methodname: 'aiplacement_a11y_get_suggestion',
            args: args,
        };

        const response = await fetchMany([request])[0];

        if (response.success) {
            // Store suggestion in issue for later use.
            currentIssues[issueIndex].suggestion = {
                reasoning: response.reasoning,
                suggested_html: response.suggested_html,
            };

            // Display the suggestion panel.
            const reasoningContent = suggestionPanel.querySelector('.reasoning-content');
            const suggestedHtmlTextarea = suggestionPanel.querySelector('.suggested-html');

            if (reasoningContent) {
                reasoningContent.textContent = response.reasoning;
            }

            if (suggestedHtmlTextarea) {
                suggestedHtmlTextarea.value = response.suggested_html;
            }

            // Show the panel (expanded by default).
            suggestionPanel.style.display = 'block';

            // Reset button.
            if (btn) {
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = await getString('suggestedfix', 'aiplacement_a11y');
            }
        } else {
            throw new Error('Failed to get suggestion');
        }

    } catch (err) {
        // Reset button on error.
        if (btn) {
            btn.disabled = false;
            btn.querySelector('.btn-text').textContent = await getString('suggestedfix', 'aiplacement_a11y');
        }

        notificationAlert(
            await getString('pluginname', component),
            'Error getting suggestion: ' + err.message
        );
    }
};

/**
 * Fix a single accessibility issue.
 *
 * @param {Number} issueIndex The index of the issue to fix.
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const fixSingleIssue = async(issueIndex, editor) => {
    const issue = currentIssues[issueIndex];
    if (!issue) {
        return;
    }

    // Check if there's a suggested fix in the textarea.
    const suggestionPanel = document.querySelector(`.suggestion-panel[data-issue-index="${issueIndex}"]`);
    const suggestedHtmlTextarea = suggestionPanel?.querySelector('.suggested-html');
    const suggestedHtml = suggestedHtmlTextarea?.value?.trim();

    // If we have a suggested fix, use it directly without AI call.
    if (suggestedHtml) {
        // Apply the suggested HTML from textarea.
        const dom = new DOMParser().parseFromString(currentHtmlContent, 'text/html');

        // Find and replace the problematic element.
        // For images, find by src.
        if (issue.type === 'missing_alt_text' && issue.src) {
            const img = dom.querySelector(`img[src="${issue.src}"]`);
            if (img) {
                img.setAttribute('alt', suggestedHtml);
                currentHtmlContent = dom.body.innerHTML;
                fixedIssues.add(issueIndex);
                await updateHtmlDisplay();

                // Mark as fixed.
                const issueElement = document.querySelector(`[data-issue-index="${issueIndex}"]`);
                if (issueElement) {
                    issueElement.classList.add('fixed');
                    const btn = issueElement.querySelector('.fix-issue-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.querySelector('.btn-text').textContent = await getString('issuesfixed', 'aiplacement_a11y');
                    }
                }
                return;
            }
        }
        // For other issue types, replace the entire HTML snippet.
        // This is a simplified approach - you may need more sophisticated logic.
        currentHtmlContent = currentHtmlContent.replace(issue.html_snippet || '', suggestedHtml);
        fixedIssues.add(issueIndex);
        await updateHtmlDisplay();

        const issueElement = document.querySelector(`[data-issue-index="${issueIndex}"]`);
        if (issueElement) {
            issueElement.classList.add('fixed');
            const btn = issueElement.querySelector('.fix-issue-btn');
            if (btn) {
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = await getString('issuesfixed', 'aiplacement_a11y');
            }
        }
        return;
    }

    // No suggested fix in textarea - proceed with normal AI fix.
    // Mark issue as fixing
    const issueElement = document.querySelector(`[data-issue-index="${issueIndex}"]`);
    if (issueElement) {
        issueElement.classList.add('fixing');
        const btn = issueElement.querySelector('.fix-issue-btn');
        if (btn) {
            btn.disabled = true;
            btn.querySelector('.btn-text').textContent = await getString('fixing', 'aiplacement_a11y');
        }
    }

    try {
        const contextId = getContextId(editor);

        // Prepare request arguments.
        const args = {
            contextid: contextId,
            htmlcontent: currentHtmlContent,
            issuetype: issue.type,
            issuedata: JSON.stringify(issue),
            imagedata: '', // Default empty.
        };

        // For image issues, convert image to base64.
        if (issue.type === 'missing_alt_text' && issue.src) {
            const imageBase64 = await getImageAsBase64(issue.src);
            if (imageBase64) {
                args.imagedata = imageBase64;
            }
        }

        const request = {
            methodname: 'aiplacement_a11y_fix_single_issue',
            args: args,
        };

        const response = await fetchMany([request])[0];

        if (response.success) {
            // Update current HTML content with the fix
            currentHtmlContent = response.fixed_content;

            // Mark issue as fixed
            fixedIssues.add(issueIndex);

            // Update the display
            await updateHtmlDisplay();

            // Update issue state
            if (issueElement) {
                issueElement.classList.remove('fixing');
                issueElement.classList.add('fixed');
                const btn = issueElement.querySelector('.fix-issue-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.querySelector('.btn-text').textContent = await getString('issuesfixed', 'aiplacement_a11y');
                }
            }
        } else {
            throw new Error('Fix failed');
        }
    } catch (error) {
        // Show error
        if (issueElement) {
            issueElement.classList.remove('fixing');
            const btn = issueElement.querySelector('.fix-issue-btn');
            if (btn) {
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = await getString('fixissue', 'aiplacement_a11y');
            }
        }
        notificationAlert(
            await getString('pluginname', component),
            'Error fixing issue: ' + error.message
        );
    }
};

/**
 * Fix all accessibility issues.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 */
const fixAllIssues = async(editor) => {
    // Disable all fix buttons
    document.querySelectorAll('.fix-issue-btn').forEach(btn => btn.disabled = true);
    const fixAllBtn = document.querySelector('.fix-all-btn');
    if (fixAllBtn) {
        fixAllBtn.disabled = true;
        fixAllBtn.textContent = await getString('fixing', 'aiplacement_a11y');
    }

    // Fix each issue sequentially
    for (let i = 0; i < currentIssues.length; i++) {
        if (!fixedIssues.has(i)) {
            await fixSingleIssue(i, editor);
        }
    }

    // Re-enable fix all button
    if (fixAllBtn) {
        fixAllBtn.disabled = false;
        fixAllBtn.textContent = await getString('fixall', 'aiplacement_a11y');
    }
};

/**
 * Update the HTML display with current content.
 */
const updateHtmlDisplay = async() => {
    // Update HTML tab
    const htmlPreview = document.querySelector('#view-html .rendered-html-preview');
    if (htmlPreview) {
        htmlPreview.innerHTML = currentHtmlContent;
    }

    // Update Code tab
    const codePreview = document.querySelector('#view-code pre');
    if (codePreview) {
        codePreview.textContent = currentHtmlContent;
    }
};

/**
 * Setup event listeners for fix buttons.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 * @param {HTMLElement} root The modal root element to search within.
 */
const setupFixButtonListeners = (editor, root) => {
    // If no root provided, use document (fallback)
    const container = root || document;

    // Suggested Fix buttons
    container.querySelectorAll('.suggest-fix-btn').forEach(btn => {
        btn.addEventListener('click', async(e) => {
            e.preventDefault();
            const issueIndex = parseInt(btn.getAttribute('data-issue-index'));
            await getSuggestedFix(issueIndex, editor);
        });
    });

    // Individual fix buttons
    container.querySelectorAll('.fix-issue-btn').forEach(btn => {
        btn.addEventListener('click', async(e) => {
            e.preventDefault();
            const issueIndex = parseInt(btn.getAttribute('data-issue-index'));
            await fixSingleIssue(issueIndex, editor);
        });
    });

    // Collapse suggestion buttons
    container.querySelectorAll('.collapse-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const suggestionPanel = btn.closest('.suggestion-panel');
            if (suggestionPanel) {
                suggestionPanel.style.display = 'none';
            }
        });
    });

    // Fix all button
    const fixAllBtn = container.querySelector('.fix-all-btn');
    if (fixAllBtn) {
        fixAllBtn.addEventListener('click', async(e) => {
            e.preventDefault();
            await fixAllIssues(editor);
        });
    }
};

/**
 * Build the modal body HTML.
 *
 * @param {Object} response The response from the accessibility fix service.
 * @returns {string} The HTML content for the modal body.
 */
const buildModalBody = (response) => {
    let html = '<div class="a11yfix-report">';

    html += '<div class="alert alert-info">';
    html += '<strong>Issues found:</strong> ' + response.issues_found;
    html += '</div>';
    html += '<div class="a11yfix-analysis mb-3">';
    html += '<h5>Analysis Report</h5>';
    html += '<div class="border p-3 bg-light">' + response.analysis_report + '</div>';
    html += '</div>';
    html += '</div>';
    return html;
};

/**
 * Escape HTML entities.
 *
 * @param {string} text The text to escape.
 * @returns {string} The escaped text.
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export const getSetup = async() => {
    const [
        buttonText,
    ] = await Promise.all([
        getString('buttontitle', component),
    ]);

    return (editor) => {
        // Register the a11yfix Toolbar Button.
        editor.ui.registry.addButton(buttonName, {
            icon,
            tooltip: buttonText,
            onAction: () => fixAccessibility(editor),
        });

        // Register the a11yfix Menu Item.
        editor.ui.registry.addMenuItem('a11yfix_menuitem', {
            icon,
            text: buttonText,
            onAction: () => fixAccessibility(editor),
        });

        // Setup auto-check after editor is fully initialized.
        editor.on('init', () => {
            setupAutoCheck(editor);
        });
    };
};
