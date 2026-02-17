<?php
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

namespace tiny_a11yfix;

use context;
use context_course;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_menuitems;
use editor_tiny\plugin_with_configuration;

/**
 * Tiny a11yfix plugin.
 *
 * @package    tiny_a11yfix
 * @copyright  2026 Patrick Thibaudeau, York University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @author     Patrick Thibaudeau
 */
class plugininfo extends plugin implements plugin_with_configuration, plugin_with_buttons, plugin_with_menuitems {

    #[\Override]
    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): bool {
        // Check if AI tools are enabled for this context.
        // Get the course context from the current context.
        $coursecontext = $context->get_course_context(false);

        if (!$coursecontext) {
            // If we can't determine the course context, default to enabled.
            return true;
        }

        // Get the course to check the enableaitools setting.
        $course = get_course($coursecontext->instanceid);

        // Check if the enableaitools setting exists and is enabled.
        if (isset($course->enableaitools)) {
            return (bool)$course->enableaitools;
        }

        // Default to enabled if the setting doesn't exist.
        return true;
    }

    public static function get_available_buttons(): array {
        return [
            'tiny_a11yfix/plugin',
        ];
    }

    public static function get_available_menuitems(): array {
        return [
            'tiny_a11yfix/plugin',
        ];
    }

    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?\editor_tiny\editor $editor = null
    ): array {
        return [
            'contextid' => $context->id,
        ];
    }
}
