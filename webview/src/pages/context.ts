import { CheckboxValueType } from 'antd/es/checkbox/Group';
import React from 'react';

export const WebviewPageContext = React.createContext<{ refreshDocFlag?: boolean, filters?: CheckboxValueType[] }>({});
