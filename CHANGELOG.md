# Change Log

All notable changes to the "tswagger" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Fixed

- Monaco Editor initialization errors by updating CDN configuration.
- Document sorting functionality in SwaggerDocDrawer not working properly.

## [2.3.0] - 2025-07-24

### Added

- Manage swagger doc URL in drawer.
- Drag-and-drop reordering for swagger doc cards.
- Support to group swagger doc.
- Support for grouped swagger docs in select components.

### Changed

- Replace inline editing with modal-based form.
- Simplify skeleton loader styles and component.

## [2.2.1] - 2025-03-02

### Added

- Support to hide empty group.

### Fixed

- Panel remains open after refreshing.

## [2.2.0] - 2024-09-14

### Added

- Adjust the style to indicate deprecated api.
- Advanced query for swagger api.

### Changed

- Increase the maximum apis number indicator from 99+ to 999+.
- Change style for empty group.

## [2.1.1] - 2024-06-13

### Added

- Compatible with lost tags in outermost object.

## [2.1.0] - 2024-06-09

### Added

- Generate hash for the same service name within the same group.

### Fixed

- Fix incorrect ts type of path parameter.
- Invalid validation for the same service name.

## [2.0.5] - 2024-03-10

### Changed

- New loading style when generating the ts result.

## [2.0.4] - 2024-03-08

### Fixed

- Lost definitions in complex nested object arrays.

## [2.0.3] - 2024-02-28

### Fixed

- Cannot validate existed service name successfully in the rename modal.

## [2.0.2] - 2024-02-27

### Fixed

- The same service name conflict with the local file.

## [2.0.1] - 2024-02-17

### Changed

- Show the rename cancelling tips by Modal.

## [2.0.0] - 2024-02-13

### Added

- Support to collapse and expand every group in the rename drawer.
- Upgrade `bing-translate-api` to @4.x which supports using Microsoft to translate.
- Add the `translation` configuration and GUI for `tswagger`.
- Support to view the local translation cache of different translation engines.

## [1.3.4] - 2024-01-31

### Added

- Validate the same service name within the same group.

### Changed

- Modify start command title.

## [1.3.3] - 2024-01-28

### Changed

- Modify start command title.

## [1.3.2] - 2024-01-26

### Changed

- Add query params of the `delete` method in the path.

## [1.3.1] - 2024-01-26

### Fixed

- Update local file failed if not renaming.

## [1.3.0] - 2024-01-20

### Added

- Compare the local result and latest result in the result modal.

### Changed

- Compatible with more situations of the api definition.

## [1.2.8] - 2024-01-14

### Fixed

- Duplicate results were generated after refresh.

## [1.2.7] - 2024-01-11

### Changed

- Unnecessary to rename `pathParamName`.

## [1.2.6] - 2024-01-10

### Changed

- Error notification will be closed after 5 seconds.

### Fixed

- Generate interface failed beacuse of the definition which has the name with slash.

## [1.2.5] - 2024-01-10

## [1.2.4] - 2024-01-03

### Fixed

- Compatible with the `get` and `delete` method which has the request body params.

## [1.2.3] - 2024-01-01

### Fixed

- The service files exported in the entry file end with `.ts` extension.

## [1.2.2] - 2023-12-31

### Added

- Support displaying whether the api has been recorded locally.

### Fixed

- Export repetitive service files in the `index.ts` file.

## [1.2.1] - 2023-12-20

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
