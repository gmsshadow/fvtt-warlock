# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a
Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.4.3]
### Added
- **Integrated combat workflow**: Click the attack icon on any weapon to run a
  fully automated opposed combat resolution — attacker roll, defender
  counter-roll (weapon skill for melee, Dodge for ranged), damage, armour
  reduction, stamina application, all in a single chat card.
- **Mighty strike detection**: Automatically detected when the winner's total is
  three or more times the loser's total. Damage is doubled per the rules.
- **Critical hit automation**: When stamina drops below 0, the system auto-rolls
  1d6 + negative stamina on the correct critical table (Slashing, Piercing,
  Crushing, or Blast) and displays the full result text. Includes a "Pull
  Critical" button to set the target to 0 stamina instead.
- **Melee counter-attacks**: In melee, if the defender wins the opposed test,
  their weapon damage is rolled and applied to the attacker — matching the
  Warlock! rules where either combatant can be injured.
- **Attack setup dialog**: Choose weapon (if multiple equipped), target (if
  multiple targeted with stamina shown), modifier, faraway, defender shield,
  flanking/pinned options.
- **Fallback attack card**: When no tokens are targeted, a simpler card is shown
  with manual "Apply Damage" and "Apply Half Damage" buttons.
- **Miscast / Wrath of the Otherworld**: Casting spells now detects a natural 1
  on the Incantation test, auto-rolls a second saving test, and if that fails,
  rolls 1d20 on the full miscast table (all 20 entries from the rulebook).
  Everything appears in a single chat card.
- **Automatic stamina cost deduction**: Spell stamina cost is deducted before
  the casting test, with an insufficient stamina check.
- **Luck auto-deduction**: Testing Luck now automatically deducts 1 from the
  current Luck value regardless of success or failure, per the rules.
- **Short rest**: Mug icon beneath Stamina — recovers half of lost stamina.
- **Long rest**: Bed icon beneath Stamina — recovers all stamina to maximum.
- Both rest actions post a summary to chat.
- All four critical hit tables embedded (Slashing, Piercing, Crushing, Blast).
- All 20 miscast table entries embedded.

### Changed
- **Warlock! theme overhaul**: Subsystem CSS now uses Cinzel (headings) and
  Crimson Pro (body) fonts via Google Fonts import, matching the angular
  medieval heading style and clean serif body text of the Traitor's Edition
  rulebook. Flat pale parchment background, thin hairline table rules, clean
  tab underlines, no glow effects — faithful to the book's stark
  ink-on-parchment aesthetic.
- Default new Character stamina set to 14/14 and Luck to 8/8 (the minimum
  possible at character creation) instead of 0/0.
- Spell test handler updated to use the new `rollSpellTest` flow instead of a
  plain skill test.
- Repository moved from GitLab to GitHub. Manifest and download URLs updated
  accordingly.

## [2.2.2]
### Added
- Side-based initiative with alternating turns and GM combatant selection.
- Actions-per-round tracking in the combat tracker with visual badges.
- Subsystem-specific CSS theming (Warlock!, Warpstar!, Wetwired) via body class
  and CSS custom properties.
- Wetwired subsystem support (skills, weapon types, damage types, combat
  options).

### Changed
- Updated to Foundry VTT v13 compatibility.
- Combat tracker hides irrelevant controls and shows side turn/round start info.

## [1.0.0]
### Added
- Support for Passions optional rule from Compendium 2.
- All Warpstar! compendia.
- Confirmation dialog before deleting items.
- Actions per round sheet counter for Characters.
- Abilities for Monsters.
- Functionality to assign and roll Monster Weapon Skill for weapons.
- Convenient skill test dialog controls.
- Ability to roll from a Vehicle sheet and incorporate its modifiers into the
  roll.
- Combat tab to show equipped weapons, equipped armour, and critical effects.

### Changed
- Simplified logic and reduced redundancy across the system.
- Made skills static once document is created.
- Organized localization file structure.
- Increased localization across system.
- Made actions per round a counter on Monster sheets.
- Combat tracker combatants are now color coded and sorted by token disposition.

### Fixed
- Changed Sleep stamina cost to 3 instead of 4.
- Changed Warpstar! "Heavy" weapon type to "Large".
- Increased migration version so that it runs properly.
- Added functionality to migrate pack actor items.

### Removed
- Notes for Monsters (replaced by abilities).

## [0.3.10]
### Changed
- Career level calculations for Warlock!
- Stamina cost for Blast, Foulness, and Sleep.
- Roll for critical tables.

### Fixed
- Career levels not calculating when a skill is advanced.

## [0.3.9]
### Fixed
- Compounding roll modifiers.

## [0.3.8]
### Added
- Compendia for Warlock!.

## [0.3.7]
### Added
- Doc-strings and comments across codebase.
- Updates to CHANGELOG.md.
- Ability to modify equipment quantities by left-clicking and right-clicking.
- Compendium migration functionality.

### Changed
- Changed Main tab name to Skills.
- Made various small refactors.
- Changed display of combatants in combat tracker with no actions left.
- Updated chat cards for items to display additional information.

## [0.3.6]
### Added
- Ability to roll 2d6+Pluck from the sheet.

### Fixed
- Modified roll chat messages to show the actor as the speaker instead of the
  user.

## [0.3.5]
### Added
- Doc-strings and comments across codebase.

## [0.3.6]
### Added
- Ability to roll 2d6+Pluck from the sheet.

### Fixed
- Modified roll chat messages to show the actor as the speaker instead of the
  user.

## [0.3.5]
### Added
- Doc-strings and comments across codebase.

## [0.3.4]
### Fixed
- Fix unarmed attack weapon to only be added to characters.

## [0.3.3]
### Added
- Unarmed attack weapon for all new characters.

### Fixed
- Fix monster Adventuring Skills rolls.

## [0.3.2]
### Fixed
- Fix faulty permission check in combat tracker.

## [0.3.1]
### Fixed
- Fix display of actions-per-round for non-GMs.

## [0.3.0]
### Added
- Rudimentary migration scripts.
- Rudimentary combat tracker.

## [0.2.1]
### Added
- Stamina cost field for spells and glyphs.

### Changed
- Update formatting of actor portraits.
- Refactor tables.

### Fixed
- Fix item descriptions not being enriched.
- Add missing dialog file for stamina costs.

## [0.2.0]
### Changed
- Update user interface across all system components.

## [0.1.9]
### Fixed
- Fix monster spells and glyphs not appearing on sheets.

## [0.1.8]
### Fixed
- Add missing super call in item sheet activateListeners().

## [0.1.7]
### Added
- Spells and glyphs to monster sheets.

### Changed
- Add jQuery listener to input elements to select all contents when
  focused.

## [0.1.6]
### Added
- Fire Ruby Designs Discord server link to README.
- Inner shadow to input elements.
- data-dtype field to input elements.

### Removed
- Remove border radius from input elements.
- Remove casts on input element values.

### Fixed
- Fix HTML tag syntax of currency fields.
- Fix career skill levels updating incorrectly.

## [0.1.5]
### Changed
- Update proper names of supported games.
- Refactor code formatting.

## [0.1.4]
### Added
- The public release of this system.

### Fixed
- Fix various one-off bugs.

## [0.1.3]
### Added
- Drag-and-drop sorting for all items.
- More accessibility.

### Changed
- Refactor formatting of HBS templates.
- Change header sizes for sheets.

### Fixed
- Fix name of Basic Tests for Glyphs.

## [0.1.2]
### Added
- Increment skill level button when advances are greater than or equal
  to zero.

### Changed
- Add callback to ystem settings to reload the world when modified.

### Fixed
- Fix career input fields from not focusing correctly.

## [0.1.1]
### Added
- Box shadow to input fields.
- Logic to prevent default event logic.
- Acknowledgments section to README.

### Changed
- Change formatting of README.

### Fixed
- Fix typo in README.
- Fix career skills not calculating correctly.

## [0.1.0]
### Added
- The initial private release of this system.

[Unreleased]: https://github.com/gmsshadow/fvtt-warlock/compare/v2.4.3...main
[2.4.3]: https://github.com/gmsshadow/fvtt-warlock/compare/v2.2.2...v2.4.3
[2.2.2]: https://github.com/gmsshadow/fvtt-warlock/compare/v1.0.0...v2.2.2
[0.3.10]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.9...v0.3.10
[0.3.9]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.8...v0.3.9
[0.3.8]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.7...v0.3.8
[0.3.7]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.6...v0.3.7
[0.3.6]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.5...v0.3.6
[0.3.5]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.4...v0.3.5
[0.3.4]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.3...v0.3.4
[0.3.3]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.2...v0.3.3
[0.3.2]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.1...v0.3.2
[0.3.1]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.0...v0.3.1
[0.3.0]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.2.1...v0.3.0
[0.2.1]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.2.0...v0.2.1
[0.2.0]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.9...v0.2.0
[0.1.9]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.8...v0.1.9
[0.1.8]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.7...v0.1.8
[0.1.7]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.6...v0.1.7
[0.1.6]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.5...v0.1.6
[0.1.5]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.4...v0.1.5
[0.1.4]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.3...v0.1.4
[0.1.3]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.2...v0.1.3
[0.1.2]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.1...v0.1.2
[0.1.1]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.1.0...v0.1.1
[0.1.0]: https://gitlab.com/azarvel/fvtt-warlock/-/releases/v0.1.0
