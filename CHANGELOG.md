# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a
Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://gitlab.com/azarvel/fvtt-warlock/-/compare/v0.3.6...develop
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
