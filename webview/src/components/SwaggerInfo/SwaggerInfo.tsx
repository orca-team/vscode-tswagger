import React from 'react';
import { OpenAPIV2 } from 'openapi-types';
import styles from './SwaggerInfo.less';
import { Badge, Collapse, Descriptions, theme } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';

export interface SwaggerInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  v2Doc: OpenAPIV2.Document;
}

const SwaggerInfo: React.FC<SwaggerInfoProps> = (props) => {
  const { className = '', v2Doc, ...otherProps } = props;

  const { token } = theme.useToken();

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <Badge.Ribbon text={`OpenAPI ${v2Doc.swagger} 规范`} color={token.colorPrimaryActive}>
        <Collapse size="large" expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
          <Collapse.Panel key="swaggerOverview" header={v2Doc.info.title}>
            <Descriptions title="">
              <Descriptions.Item label="基本路径" span={3}>
                {v2Doc.basePath}
              </Descriptions.Item>
              <Descriptions.Item label="描述信息" span={3}>
                {v2Doc.info.description}
              </Descriptions.Item>
              <Descriptions.Item label="API 版本">{v2Doc.info.version}</Descriptions.Item>
              <Descriptions.Item label="服务器地址">{v2Doc.host}</Descriptions.Item>
              <Descriptions.Item label="传输协议">{v2Doc.schemes?.join('、') ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="联系者">{v2Doc.info.contact?.name ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="联系地址">{v2Doc.info.contact?.url ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{v2Doc.info.contact?.email ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Collapse.Panel>
        </Collapse>
      </Badge.Ribbon>
    </div>
  );
};

export default SwaggerInfo;
