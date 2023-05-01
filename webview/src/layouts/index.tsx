import { Outlet, history } from 'umi';
import { ConfigProvider, theme } from 'antd';
import styles from './index.less';
import { useMount } from 'ahooks';
import { GlobalStateProvider } from '@/states/globalState';

export default function Layout() {
  // useMount(() => {
  //   history.push('/swagger-to-ts');
  // });

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <GlobalStateProvider>
        <div className={styles.root}>
          <Outlet />
        </div>
      </GlobalStateProvider>
    </ConfigProvider>
  );
}
