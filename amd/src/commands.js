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
import {addNotification, alert as notificationAlert, exception as notificationException} from 'core/notification';
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

    // Show loading notification.
    const loadingString = await getString('analyzing', component);
    addNotification({
        message: loadingString,
        type: 'info',
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
            notificationException({message: await getString('fixfailed', component)});
            return;
        }

        if (!response.has_issues) {
            // No issues found.
            notificationAlert(
                await getString('pluginname', component),
                await getString('noaccessibilityissues', component)
            );
            return;
        }

        // Show modal with results.
        await showResultsModal(editor, response);

    } catch (error) {
        notificationException(error);
    }
};

/**
 * Show a modal with the accessibility fix results.
 *
 * @param {TinyMCE.Editor} editor The TinyMCE editor instance.
 * @param {Object} response The response from the accessibility fix service.
 */
const showResultsModal = async(editor, response) => {
    const applyText = await getString('applychanges', component);
    const cancelText = await getString('cancel', 'core');

    const modal = await Modal.create({
        title: await getString('accessibilityreport', component),
        body: buildModalBody(response),
        footer: '<button type="button" class="btn btn-primary" data-action="apply">' + applyText + '</button>' +
                '<button type="button" class="btn btn-secondary" data-action="cancel">' + cancelText + '</button>',
        large: true,
        removeOnClose: true,
        show: true,
    });

    const $root = await modal.getRoot();
    const root = $root[0];

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
