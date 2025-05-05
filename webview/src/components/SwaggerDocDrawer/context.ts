import { SwaggerUrlConfigItem } from '@/utils/types';
import React from 'react';

export const SwaggerDocDrawerContext = React.createContext<{
  swaggerUrlList: Partial<SwaggerUrlConfigItem>[];
}>({ swaggerUrlList: [] });

export const useSwaggerDocDrawerContext = () => React.useContext(SwaggerDocDrawerContext);
