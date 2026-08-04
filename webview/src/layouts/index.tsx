import { ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { HoxRoot } from 'hox';
import { useMemo } from 'react';
import { Outlet } from 'umi';
import useVsCodeThemeColors from '@/hooks/useVsCodeThemeColors';
import type { VsCodeThemeColors } from '@/hooks/useVsCodeThemeColors';
import styles from './index.less';

/**
 * Ant Design derives many alias colors in JS, so token colors must be concrete
 * values instead of CSS var() strings. The hook resolves VS Code webview CSS
 * variables at runtime before they enter antd's color pipeline.
 */
function buildAntdTheme(colors: VsCodeThemeColors): ThemeConfig {
  return {
    token: {
      colorBgBase: colors.editorBg,
      colorTextBase: colors.fg,
      colorBgLayout: colors.editorBg,
      colorBgContainer: colors.panelBg,
      colorBgElevated: colors.elevatedBg,
      colorBorder: colors.border,
      colorBorderSecondary: colors.border,
      colorSplit: colors.border,
      colorPrimary: colors.buttonBg,
      colorPrimaryText: colors.link,
      colorPrimaryTextHover: colors.linkActive,
      colorPrimaryTextActive: colors.linkActive,
      colorLink: colors.link,
      colorLinkHover: colors.linkActive,
      colorLinkActive: colors.linkActive,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      fontFamily: colors.fontFamily,
      fontSize: 13,
      borderRadius: 4,
      boxShadow: 'none',
      boxShadowSecondary: 'none',
      boxShadowTertiary: 'none',
    },
    components: {
      Button: {
        primaryColor: colors.buttonFg,
      },
      Input: {
        colorBgContainer: colors.inputBg,
        colorText: colors.inputFg,
        colorBorder: colors.inputBorder,
        hoverBorderColor: colors.focusBorder,
        activeBorderColor: colors.focusBorder,
        activeShadow: 'none',
      },
      Select: {
        colorBgContainer: colors.inputBg,
        colorText: colors.inputFg,
        colorTextPlaceholder: colors.mutedFg,
        colorBorder: colors.inputBorder,
        selectorBg: colors.inputBg,
        clearBg: colors.inputBg,
        hoverBorderColor: colors.focusBorder,
        activeBorderColor: colors.focusBorder,
        activeOutlineColor: 'transparent',
        optionActiveBg: colors.hoverBg,
        optionSelectedBg: colors.hoverBg,
        optionSelectedColor: colors.fg,
      },
      Modal: {
        contentBg: colors.elevatedBg,
        headerBg: colors.elevatedBg,
        footerBg: colors.elevatedBg,
      },
      Menu: {
        itemSelectedBg: colors.activeBg,
        itemSelectedColor: colors.fg,
        itemHoverBg: colors.hoverBg,
      },
      Tabs: {
        itemSelectedColor: colors.link,
        itemHoverColor: colors.linkActive,
        itemActiveColor: colors.linkActive,
        inkBarColor: colors.focusBorder,
      },
      Checkbox: {
        colorPrimary: colors.link,
        colorPrimaryHover: colors.linkActive,
        colorWhite: colors.buttonFg,
        colorBgContainer: 'transparent',
        colorBorder: colors.focusBorder,
      },
      Badge: {
        colorTextLightSolid: colors.badgeFg,
      },
      Tooltip: {
        colorBgSpotlight: colors.elevatedBg,
        colorTextLightSolid: colors.fg,
        boxShadowSecondary: 'none',
      },
    },
  };
}

export default function Layout() {
  const colors = useVsCodeThemeColors();
  const vsCodeTheme = useMemo(() => buildAntdTheme(colors), [colors]);

  return (
    <ConfigProvider theme={vsCodeTheme} locale={zhCN}>
      <HoxRoot>
        <div className={styles.root}>
          <Outlet />
        </div>
      </HoxRoot>
    </ConfigProvider>
  );
}
