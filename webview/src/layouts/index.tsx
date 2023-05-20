import { ConfigProvider, theme } from 'antd';
import { HoxRoot } from 'hox';
import { Outlet } from 'umi';
import styles from './index.less';

export default function Layout() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <HoxRoot>
        <div className={styles.root}>
          <Outlet />
        </div>
      </HoxRoot>
    </ConfigProvider>
  );
}
