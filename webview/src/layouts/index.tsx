import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { HoxRoot } from 'hox';
import { Outlet } from 'umi';
import styles from './index.less';

export default function Layout() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }} locale={zhCN}>
      <HoxRoot>
        <div className={styles.root}>
          <Outlet />
        </div>
      </HoxRoot>
    </ConfigProvider>
  );
}
