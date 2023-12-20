# Change Log

All notable changes to the "tswagger" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Changed

- Modify the result modal title.

## [1.2.0] - 2023-12-19

### Added

- Support to map the `basePath` by adding `basePathMapping` config.

### Fixed

- Cannot generate correct request ts type of the `array` schema type.

## [1.1.1] - 2023-12-17

### Fixed

- Cannot show the diff content after renaming the interface.

## [1.1.1] - 2023-12-15

### Fixed

- Cannot rename the interface.

## [1.1.0] - 2023-12-15

### Changed

- Compatible with the `post` and `put` method which has the query params.

### Fixed

- Duplicate generated interface name because of the same `operationId`.
- Missing `FormData` type in the rename modal.

## [1.0.9] - 2023-12-13

### Fixed

- Generate wrong optional property.

## [1.0.8] - 2023-12-12

### Fixed

- Generate other interfaces failed in the same group.

## [1.0.7] - 2023-12-12

### Fixed

- Missing types caused by tsType.

## [1.0.6] - 2023-12-12

### Fixed

- Convert recursive array items failed.

## [1.0.5] - 2023-09-05

### Fixed

- Generated interface name does not match ([#2](https://github.com/orca-team/vscode-tswagger/issues/2)).

## [1.0.4] - 2023-09-04

### Fixed

- Unable to generate typescript when opens local swagger json file

## [1.0.3] - 2023-08-22

### Added

- Keep-a-changelog plugin added.

## [1.0.2]

### Added

- add `standard-version`

## [1.0.1]

### Added

- add publish workflows

## [1.0.0]

### Added

- Initial release
