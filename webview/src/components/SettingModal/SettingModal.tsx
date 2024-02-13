import React, { useEffect, useState } from 'react';
import styles from './SettingModal.less';
import { Empty, Menu, MenuProps, Modal, ModalProps } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import TranslateSetting from './TranslateSetting';
import { useService } from '@orca-fe/hooks';
import { apiQueryExtInfo } from '@/services';
import { useGlobalState } from '@/states/globalState';
import { pick } from 'lodash-es';

const menuItems: MenuProps['items'] = [
  {
    label: '翻译',
    key: 'translate',
    icon: <TranslationOutlined />,
  },
];

export interface SettingModalProps extends ModalProps {}

const SettingModal = (props: SettingModalProps) => {
  const { className = '', ...otherProps } = props;
  const { setExtSetting } = useGlobalState();
  const [settingKey, setSettingKey] = useState<string>('translate');
  const { data: extInfo } = useService(apiQueryExtInfo);

  const renderContent = useMemoizedFn(() => {
    if (settingKey === 'translate') {
      return <TranslateSetting />;
    }

    return <Empty />;
  });

  useEffect(() => {
    if (extInfo?.setting) {
      setExtSetting(pick(extInfo.setting ?? {}, ['swaggerUrlList', 'translation']));
    }
  }, [extInfo?.setting]);

  return (
    <Modal
      title="设置"
      className={`${styles.root} ${className}`}
      width={960}
      okButtonProps={{ style: { display: 'none' } }}
      cancelText="关闭"
      maskClosable={false}
      {...otherProps}
    >
      <div className={styles.container}>
        <Menu
          className={styles.menu}
          theme="light"
          selectedKeys={[settingKey]}
          items={menuItems}
          onClick={(info) => {
            setSettingKey(info.key);
          }}
        />
        <div className={styles.content}>{renderContent()}</div>
      </div>
    </Modal>
  );
};

export default SettingModal;
