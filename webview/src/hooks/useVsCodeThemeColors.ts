import { useEffect, useState } from 'react';

const FONT_FAMILY_FALLBACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type ThemeKind = 'dark' | 'light';

export interface VsCodeThemeColors {
  fontFamily: string;
  editorBg: string;
  fg: string;
  mutedFg: string;
  panelBg: string;
  elevatedBg: string;
  hoverBg: string;
  activeBg: string;
  border: string;
  focusBorder: string;
  link: string;
  linkActive: string;
  buttonBg: string;
  buttonFg: string;
  buttonHoverBg: string;
  inputBg: string;
  inputFg: string;
  inputBorder: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  badgeBg: string;
  badgeFg: string;
}

const FALLBACKS: Record<ThemeKind, VsCodeThemeColors> = {
  dark: {
    fontFamily: FONT_FAMILY_FALLBACK,
    editorBg: '#1e1e1e',
    fg: '#cccccc',
    mutedFg: '#999999',
    panelBg: '#252526',
    elevatedBg: '#252526',
    hoverBg: '#2a2d2e',
    activeBg: '#094771',
    border: '#454545',
    focusBorder: '#007fd4',
    link: '#3794ff',
    linkActive: '#3794ff',
    buttonBg: '#0e639c',
    buttonFg: '#ffffff',
    buttonHoverBg: '#1177bb',
    inputBg: '#3c3c3c',
    inputFg: '#cccccc',
    inputBorder: '#454545',
    success: '#2da44e',
    warning: '#cca700',
    error: '#f14c4c',
    info: '#3794ff',
    badgeBg: '#4d4d4d',
    badgeFg: '#ffffff',
  },
  light: {
    fontFamily: FONT_FAMILY_FALLBACK,
    editorBg: '#ffffff',
    fg: '#1f1f1f',
    mutedFg: '#6a6a6a',
    panelBg: '#f3f3f3',
    elevatedBg: '#f3f3f3',
    hoverBg: '#e8e8e8',
    activeBg: '#0060c0',
    border: '#c8c8c8',
    focusBorder: '#0078d4',
    link: '#006ab1',
    linkActive: '#006ab1',
    buttonBg: '#0078d4',
    buttonFg: '#ffffff',
    buttonHoverBg: '#106ba3',
    inputBg: '#ffffff',
    inputFg: '#1f1f1f',
    inputBorder: '#c8c8c8',
    success: '#1a7f37',
    warning: '#bf8803',
    error: '#d13438',
    info: '#006ab1',
    badgeBg: '#c4c4c4',
    badgeFg: '#333333',
  },
};

function getThemeKind(): ThemeKind {
  if (typeof document === 'undefined') {
    return 'dark';
  }
  const classList = document.body.classList;
  if (
    classList.contains('vscode-light') ||
    classList.contains('vscode-high-contrast-light')
  ) {
    return 'light';
  }
  return 'dark';
}

function readCssVar(
  bodyStyle: CSSStyleDeclaration,
  rootStyle: CSSStyleDeclaration,
  name: string,
) {
  return (
    bodyStyle.getPropertyValue(name).trim() ||
    rootStyle.getPropertyValue(name).trim()
  );
}

function pickCssVar(
  bodyStyle: CSSStyleDeclaration,
  rootStyle: CSSStyleDeclaration,
  names: string[],
  fallback: string,
) {
  for (const name of names) {
    const value = readCssVar(bodyStyle, rootStyle, name);
    if (value) {
      return value;
    }
  }
  return fallback;
}

function areColorsEqual(
  prev: VsCodeThemeColors,
  next: VsCodeThemeColors,
): boolean {
  return (Object.keys(prev) as Array<keyof VsCodeThemeColors>).every(
    (key) => prev[key] === next[key],
  );
}

function getVsCodeThemeColors(): VsCodeThemeColors {
  const fallbacks = FALLBACKS[getThemeKind()];
  if (typeof document === 'undefined') {
    return fallbacks;
  }

  const bodyStyle = getComputedStyle(document.body);
  const rootStyle = getComputedStyle(document.documentElement);
  const editorBg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-editor-background'],
    fallbacks.editorBg,
  );
  const fg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-foreground'],
    fallbacks.fg,
  );
  const mutedFg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-descriptionForeground'],
    fallbacks.mutedFg,
  );
  const panelBg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-sideBar-background'],
    editorBg || fallbacks.panelBg,
  );
  const elevatedBg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-editorWidget-background', '--vscode-sideBar-background'],
    panelBg || fallbacks.elevatedBg,
  );
  const border = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-widget-border', '--vscode-panel-border'],
    fallbacks.border,
  );
  const focusBorder = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-focusBorder'],
    fallbacks.focusBorder,
  );
  const link = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-textLink-foreground'],
    fallbacks.link,
  );
  const linkActive = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-textLink-activeForeground'],
    link || fallbacks.linkActive,
  );
  const inputFg = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-input-foreground'],
    fg || fallbacks.inputFg,
  );
  const inputBorder = pickCssVar(
    bodyStyle,
    rootStyle,
    ['--vscode-input-border'],
    border || fallbacks.inputBorder,
  );

  return {
    fontFamily: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-font-family'],
      fallbacks.fontFamily,
    ),
    editorBg,
    fg,
    mutedFg,
    panelBg,
    elevatedBg,
    hoverBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-list-hoverBackground'],
      fallbacks.hoverBg,
    ),
    activeBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-list-activeSelectionBackground', '--vscode-button-background'],
      fallbacks.activeBg,
    ),
    border,
    focusBorder,
    link,
    linkActive,
    buttonBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-button-background'],
      fallbacks.buttonBg,
    ),
    buttonFg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-button-foreground'],
      fallbacks.buttonFg,
    ),
    buttonHoverBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-button-hoverBackground'],
      fallbacks.buttonHoverBg,
    ),
    inputBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-input-background'],
      fallbacks.inputBg,
    ),
    inputFg,
    inputBorder,
    // Avoid semantic fallback chains such as errorForeground or testing icons:
    // some themes define them as dark colors that are unreadable in tiny icons.
    success: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-charts-green'],
      fallbacks.success,
    ),
    warning: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-editorWarning-foreground'],
      fallbacks.warning,
    ),
    error: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-editorError-foreground'],
      fallbacks.error,
    ),
    info: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-editorInfo-foreground'],
      fallbacks.info,
    ),
    badgeBg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-badge-background'],
      fallbacks.badgeBg,
    ),
    badgeFg: pickCssVar(
      bodyStyle,
      rootStyle,
      ['--vscode-badge-foreground'],
      fallbacks.badgeFg,
    ),
  };
}

export default function useVsCodeThemeColors(): VsCodeThemeColors {
  const [colors, setColors] = useState<VsCodeThemeColors>(getVsCodeThemeColors);

  useEffect(() => {
    let animationFrameId = 0;

    const syncColors = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        setColors((prev) => {
          const next = getVsCodeThemeColors();
          return areColorsEqual(prev, next) ? prev : next;
        });
      });
    };

    const observer = new MutationObserver(syncColors);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    syncColors();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      observer.disconnect();
    };
  }, []);

  return colors;
}
