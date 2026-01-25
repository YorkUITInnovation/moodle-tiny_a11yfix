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

/**
 * Options helper for Tiny a11yfix plugin.
 *
 * @module      tiny_a11yfix/options
 * @copyright   2026 Patrick Thibaudeau, York University
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @author      Patrick Thibaudeau
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from './common';

const contextIdName = getPluginOptionName(pluginName, 'contextid');

/**
 * Options registration function.
 *
 * @param {TinyMCE.Editor} editor
 */
export const register = (editor) => {
    const registerOption = editor.options.register;

    registerOption(contextIdName, {
        processor: 'number',
        "default": 0,
    });
};

/**
 * Get the context ID for this editor instance.
 *
 * @param {TinyMCE.Editor} editor
 * @returns {number}
 */
export const getContextId = (editor) => {
    return editor.options.get(contextIdName);
};
