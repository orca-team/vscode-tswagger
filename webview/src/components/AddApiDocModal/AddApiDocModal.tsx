import React from 'react';
import { Modal, ModalProps, Form, Input, Button, message } from 'antd';
import { postMessage } from '@/utils/vscode';
import styles from './AddRemoteUrlModal.less';
import useMessageListener from '@/hooks/useMessageListener';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useMount } from 'ahooks';

const FormList = Form.List;
const FormItem = Form.Item;

export interface AddRemoteUrlModalProps extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  onOk?: () => void;
  onCancel?: () => void;
}

const AddRemoteUrlModal: React.FC<AddRemoteUrlModalProps> = (props) => {
  const { className = '', onOk, onCancel = () => {}, ...otherProps } = props;

  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    console.log('values', values);
    postMessage({
      method: 'webview-addRemoteUrl',
      params: {
        list: values.list ?? [],
      },
    });
  };

  const handleCancel = () => {
    onCancel && onCancel();
  };

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'vscode-addRemoteUrl') {
      if (!vscodeMsg.success) {
        message.error(vscodeMsg.errMsg ?? '远程接口增加失败');
        return;
      }
      message.success('远程接口更新成功');
      handleCancel();
    }
  });

  useMount(() => {
    form.setFieldValue('list', [{ name: '', url: '' }]);
  });

  return (
    <Modal
      title="添加 swagger 远程接口"
      className={className}
      okText="确定增加"
      cancelText="取消"
      {...otherProps}
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        handleCancel();
      }}
    >
      <Form form={form} layout="vertical">
        <FormList name="list">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <div key={key} className={`${styles.fieldWrapper}`}>
                  <FormItem label="名称" name={[name, 'name']} rules={[{ required: true, message: '请输入接口名称' }]}>
                    <Input placeholder="请输入接口名称" />
                  </FormItem>
                  <FormItem label="Swagger 远程接口地址" name={[name, 'url']} rules={[{ required: true, message: '请输入 Swagger 远程接口地址' }]}>
                    <Input placeholder="请输入 Swagger 远程接口地址" />
                  </FormItem>
                  {fields.length > 1 && (
                    <Button
                      type="link"
                      onClick={() => {
                        remove(name);
                      }}
                      className={`${styles.deleteButton}`}
                    >
                      删除本组接口
                    </Button>
                  )}
                </div>
              ))}

              <Button type="dashed" icon={<PlusCircleOutlined />} onClick={add} style={{ width: '100%' }}>
                添加新的一组远程接口
              </Button>
            </>
          )}
        </FormList>
      </Form>
    </Modal>
  );
};

export default AddRemoteUrlModal;
