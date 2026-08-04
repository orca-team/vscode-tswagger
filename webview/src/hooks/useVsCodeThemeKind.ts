import { useEffect, useState } from 'react';

/**
 * Monaco built-in theme names that mirror the current VS Code webview theme.
 * VS Code applies one of `vscode-light` / `vscode-dark` / `vscode-high-contrast`
 * (or `vscode-high-contrast-light`) on the webview `body`.
 */
export type VsCodeMonacoTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

function getMonacoThemeFromBody(): VsCodeMonacoTheme {
  const classList = document.body.classList;
  if (classList.contains('vscode-high-contrast-light')) {
    return 'hc-light';
  }
  if (classList.contains('vscode-high-contrast')) {
    return 'hc-black';
  }
  if (classList.contains('vscode-light')) {
    return 'vs';
  }
  return 'vs-dark';
}

/**
 * Maps the VS Code webview body theme class to a Monaco built-in theme and
 * keeps it in sync while the webview is open (e.g. when the user switches the
 * editor color theme without reloading the webview).
 */
export default function useVsCodeThemeKind(): VsCodeMonacoTheme {
  const [monacoTheme, setMonacoTheme] = useState<VsCodeMonacoTheme>(getMonacoThemeFromBody);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMonacoTheme(getMonacoThemeFromBody());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
    };
  }, []);

  return monacoTheme;
}
