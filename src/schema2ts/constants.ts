/**
 * 文件头说明
 */
export const FILE_DESCRIPTION = `/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA TSWAGGER VSCODE EXTENSION     ##
 * ## DO NOT MODIFY THIS FILE                                   ##
 * ##                                                           ##
 * ## GITHUB: https://github.com/Orchardxyz/vscode-tswagger     ##
 * ---------------------------------------------------------------
 */

`;

/**
 * JSON -> FormData
 */
export const JSON_TO_FORM_DATA = `const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  })\n\n`;
