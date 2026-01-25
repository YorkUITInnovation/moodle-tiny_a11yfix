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
    const applyText = await getString('applychanges', component);
    const cancelText = await getString('cancel', 'core');

    // Update modal body and footer.
    const $root = await modal.getRoot();
    const root = $root[0];

    // Update body.
    const bodyElement = root.querySelector('.modal-body');
    if (bodyElement) {
        bodyElement.innerHTML = buildModalBody(response);
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
        footerElement.innerHTML = '<button type="button" class="btn btn-primary" data-action="apply">' + applyText + '</button>' +
                '<button type="button" class="btn btn-secondary" data-action="cancel">' + cancelText + '</button>';
    }

    // Add event listeners.
    root.addEventListener('click', (e) => {
        const applyAction = e.target.closest('[data-action="apply"]');
        const cancelAction = e.target.closest('[data-action="cancel"]');

        if (applyAction) {
            e.preventDefault();
            editor.setContent(response.fixed_content);
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
    html += '<div class="a11yfix-preview">';
    html += '<h5>Fixed Content Preview</h5>';
    html += '<div class="border p-3" style="max-height: 300px; overflow-y: auto;">';
    html += '<pre style="white-space: pre-wrap;">' + escapeHtml(response.fixed_content) + '</pre>';
    html += '</div>';
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
    };
};
