import React, { useEffect, useState } from 'react';
import styles from './TranslateSetting.less';
import { Form, Input, Select, SelectProps, Tabs, theme } from 'antd';
import SectionLayout from '@/components/SectionLayout';
import { useLockFn, useMemoizedFn, useMount, useToggle } from 'ahooks';
import { useService } from '@orca-fe/hooks';
import { apiQueryLocalTranslation, apiUpdateTranslationConfig } from '@/services';
import LocalTranslationList from './LocalTranslationList';
import { OpenBox } from '@orca-fe/pocket';
import SettingAction from '../SettingAction';
import notification from '@/utils/notification';
import { useGlobalState } from '@/states/globalState';

const translateEngineOptions: SelectProps['options'] = [
  {
    label: 'Bing',
    value: 'Bing',
  },
  {
    label: 'Microsoft',
    value: 'Microsoft',
  },
  {
    label: 'Microsoft (Private Key)',
    value: 'PrivateMicrosoft',
  },
];

export interface TranslateSettingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {}

const TranslateSetting = (props: TranslateSettingProps) => {
  const { className = '', title, ...otherProps } = props;
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { data: localTranslation = [], run: queryLocalTranslation } = useService(apiQueryLocalTranslation, { manual: true });
  const { extSetting } = useGlobalState();
  const [isValueChanged, setIsValueChanged] = useState(false);
  const [translationVisible, { toggle: changeTranslationVisible }] = useToggle(true);

  const engine = Form.useWatch('engine', form);
  const isPrivateMicrosoft = engine === 'PrivateMicrosoft';

  const getTranslationByEngine = useMemoizedFn((engine: string) => {
    return localTranslation.find((it) => it.engine === engine)?.translation ?? {};
  });

  const handleOnSave = useLockFn(async () => {
    const values = await form.validateFields();
    await apiUpdateTranslationConfig(values);
    notification.success('翻译配置已保存');
  });

  useEffect(() => {
    form.setFieldsValue(extSetting.translation);
  }, [extSetting.translation]);

  useMount(() => {
    queryLocalTranslation();
  });

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <SectionLayout title="翻译引擎">
        <Form
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          onValuesChange={() => {
            setIsValueChanged(true);
          }}
        >
          <Form.Item label="当前翻译引擎" name="engine">
            <Select allowClear={false} options={translateEngineOptions} />
          </Form.Item>
          {isPrivateMicrosoft ? (
            <>
              <Form.Item label="Azure 密钥" name="Ocp-Apim-Subscription-Key" help="Ocp-Apim-Subscription-Key">
                <Input.TextArea placeholder="请输入" autoSize />
              </Form.Item>
              <Form.Item label="token" name="Authorization" help="Authorization">
                <Input.TextArea placeholder="请输入" autoSize />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </SectionLayout>

      <SectionLayout
        title="本地翻译缓存"
        titleProps={{
          extra: (
            <div className={styles.foldToggle} style={{ color: token.colorPrimary }} onClick={changeTranslationVisible}>
              {translationVisible ? '收起' : '展开'}
            </div>
          ),
        }}
      >
        <OpenBox open={translationVisible}>
          <Tabs
            items={[
              {
                label: 'Bing',
                key: 'Bing',
                children: <LocalTranslationList translation={getTranslationByEngine('Bing')} />,
              },
              {
                label: 'Microsoft',
                key: 'Microsoft',
                children: <LocalTranslationList translation={getTranslationByEngine('Microsoft')} />,
              },
            ]}
          />
        </OpenBox>
      </SectionLayout>

      <SettingAction saveButtonProps={{ disabled: !isValueChanged }} onSave={handleOnSave} />
    </div>
  );
};

export default TranslateSetting;
