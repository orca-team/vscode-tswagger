import React, { useState, useRef } from 'react';
import styles from './SwaggerDocDrawer.module.less';
import { Button, Drawer, DrawerProps, Space, Modal } from 'antd';
import { useGlobalState } from '@/states/globalState';
import { PlusOutlined } from '@ant-design/icons';
import useSwaggerUrlService from '@/hooks/useSwaggerUrlService';
import DocCard from './DocCard';
import { useMemoizedFn } from 'ahooks';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { SwaggerDocDrawerContext } from './context';
import { isEqual } from 'lodash-es';
import notification from '@/utils/notification';

export interface SwaggerDocDrawerProps extends Omit<DrawerProps, 'onClose'> {
  onClose?: () => void;
}

const SwaggerDocDrawer = (props: SwaggerDocDrawerProps) => {
  const { className = '', onClose, ...otherProps } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { extSetting } = useGlobalState();
  const [swaggerUrlList, setSwaggerUrlList] = useState<Partial<SwaggerUrlConfigItem>[]>(extSetting.swaggerUrlList);
  const swaggerService = useSwaggerUrlService();
  const [editingKeys, setEditingKeys] = useState<number[]>([]);

  // 保存原始数据用于比较
  const originalDataRef = useRef(extSetting.swaggerUrlList);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useMemoizedFn(() => {
    return !isEqual(swaggerUrlList, originalDataRef.current);
  });

  // 检查是否有正在编辑的项
  const hasEditingItems = useMemoizedFn(() => {
    return editingKeys.length > 0;
  });

  // 处理保存
  const handleSave = useMemoizedFn(async () => {
    if (hasEditingItems()) {
      notification.warning('有未保存的更改');
      return;
    }
    await swaggerService.updateSwaggerUrlList(swaggerUrlList as SwaggerUrlConfigItem[]);
    onClose?.();
  });

  // 处理关闭
  const handleClose = useMemoizedFn(() => {
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '确认关闭',
        content: '有未保存的更改，是否确认关闭？',
        onOk: () => {
          onClose?.();
        },
      });
      return;
    }
    onClose?.();
  });

  const handleAdd = useMemoizedFn(() => {
    setSwaggerUrlList((prev) => {
      const newList = [...prev];
      newList.push({
        key: swaggerService.generateKey(),
      });
      return newList;
    });
    setEditingKeys([...editingKeys, swaggerUrlList.length]);

    // 添加滚动到底部的逻辑
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 200);
  });

  const handleDelete = useMemoizedFn((index: number) => {
    setSwaggerUrlList(swaggerUrlList.filter((_, i) => i !== index));
  });

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...swaggerUrlList];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newList.length) {
      return;
    }
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setSwaggerUrlList(newList);
  };

  return (
    <Drawer
      className={`${styles.root} ${className}`}
      title="Swagger 文档地址管理"
      width="60%"
      maskClosable={false}
      onClose={handleClose}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新的接口文档地址
        </Button>
      }
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        </div>
      }
      {...otherProps}
    >
      <Space direction="vertical" style={{ width: '100%', height: '100%', overflow: 'auto' }} size="small" ref={containerRef}>
        <SwaggerDocDrawerContext.Provider value={{ swaggerUrlList }}>
          {swaggerUrlList.map((item, index) => (
            <div className={styles.item} key={index}>
              <DocCard
                data={item}
                editing={editingKeys.includes(index)}
                onEditingChange={(editing) => {
                  if (editing) {
                    setEditingKeys([...editingKeys, index]);
                  } else {
                    setEditingKeys(editingKeys.filter((key) => key !== index));
                  }
                }}
                moveUpDisabled={index === 0}
                moveDownDisabled={index === swaggerUrlList.length - 1}
                onMoveUp={() => moveItem(index, 'up')}
                onMoveDown={() => moveItem(index, 'down')}
                onSave={(data) => {
                  setSwaggerUrlList((prev) => {
                    const newList = [...prev];
                    newList[index] = data;
                    return newList;
                  });
                }}
                onDelete={() => handleDelete(index)}
              ></DocCard>
            </div>
          ))}
        </SwaggerDocDrawerContext.Provider>
      </Space>
    </Drawer>
  );
};

export default SwaggerDocDrawer;
