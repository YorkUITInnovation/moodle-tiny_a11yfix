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

/**
 * Tiny a11yfix plugin version details.
 *
 * @package    tiny_a11yfix
 * @copyright  2026 Patrick Thibaudeau, York University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @author     Patrick Thibaudeau
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026021501;
$plugin->requires  = 2025092600;
$plugin->component = 'tiny_a11yfix';
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = '0.8.0';
$plugin->dependencies = array(
    'aiplacement_a11y' => 2026021401,
);
