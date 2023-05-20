import React, { useEffect, useState } from 'react';
import styles from './TsGenerateSpin.less';
import useMessageListener from '@/hooks/useMessageListener';
import { Progress, Spin, SpinProps } from 'antd';

export interface TsGenerateSpinProps extends SpinProps {}

const TsGenerateSpin: React.FC<TsGenerateSpinProps> = (props) => {
  const { className = '', children, spinning, ...otherProps } = props;
  const [progress, setProgress] = useState<number>(0);

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'webview-tsGenProgress') {
      const { current, total } = vscodeMsg.data;
      setProgress(Math.ceil((current / total) * 100));
    }
  });

  useEffect(() => {
    if (spinning) {
      setProgress(0);
    }
  }, [spinning]);

  return (
    <Spin
      className={`${styles.root} ${className}`}
      {...otherProps}
      spinning={spinning}
      tip={
        <div className={styles.progress}>
          <div className={styles.title}>{`Typescript 生成中: ${progress}%`}</div>
          <Progress steps={20} percent={progress} showInfo={false} strokeWidth={10} />
        </div>
      }
    >
      {children}
    </Spin>
  );
};

export default TsGenerateSpin;
