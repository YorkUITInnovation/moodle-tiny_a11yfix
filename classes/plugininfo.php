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
