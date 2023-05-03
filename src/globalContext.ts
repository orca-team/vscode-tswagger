import * as vscode from 'vscode';

let extensionContext: vscode.ExtensionContext;

export const setGlobalContext = (context: vscode.ExtensionContext) => {
  extensionContext = context;
};

export const getGlobalContext = () => extensionContext;
