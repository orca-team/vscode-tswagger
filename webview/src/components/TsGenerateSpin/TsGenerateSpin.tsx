import React, { useEffect, useState } from 'react';
import styles from './TsGenerateSpin.less';
import useMessageListener from '@/hooks/useMessageListener';
import { Progress, theme } from 'antd';
import { createPortal } from 'react-dom';
import { useMemoizedFn, useScroll } from 'ahooks';

const contentHeight = 52;

export interface TsGenerateSpinProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'defaultValue' | 'onChange'> {
  spinning?: boolean;
}

const TsGenerateSpin: React.FC<TsGenerateSpinProps> = (props) => {
  const { className = '', spinning, ...otherProps } = props;

  const { token } = theme.useToken();
  const [progress, setProgress] = useState<number>(0);
  const bodyScroll = useScroll();

  const containerTop = Math.max((bodyScroll?.top ?? 0) - contentHeight, 0);

  const lockBody = useMemoizedFn(() => {
    document.body.style.overflowY = 'hidden';
  });

  const unlockBody = useMemoizedFn(() => {
    document.body.style.overflowY = 'auto';
  });

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'webview-tsGenProgress') {
      const { current, total } = vscodeMsg.data;
      setProgress(Math.ceil((current / total) * 100));
    }
  });

  useEffect(() => {
    if (spinning) {
      setProgress(0);
      lockBody();
    } else {
      unlockBody();
    }
  }, [spinning]);

  return spinning
    ? createPortal(
        <div className={styles.root} style={{ top: containerTop }} {...otherProps}>
          <div
            className={styles.mask}
            style={{ height: `calc(100% + ${contentHeight}px)`, backgroundColor: token.colorBgMask, zIndex: token.zIndexPopupBase }}
          />
          <div className={styles.content} style={{ zIndex: token.zIndexPopupBase }}>
            <div className={styles.loading}>
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className={styles.progress}>
              <div className={styles.title}>{`Typescript 生成中: ${progress}%`}</div>
              <Progress steps={20} percent={progress} showInfo={false} strokeWidth={10} />
            </div>
          </div>
        </div>,
        document.body,
        'TsGenerateSpin',
      )
    : null;
};

export default TsGenerateSpin;
