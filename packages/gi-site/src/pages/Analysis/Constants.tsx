import { DatabaseOutlined } from '@ant-design/icons';
import React from 'react';
import { Panel } from '../../components';

export const navbarOptions = [
  {
    id: 'style',
    name: '样式',
    icon: <DatabaseOutlined />,
  },

  {
    id: 'layout',
    name: '布局',
    icon: <DatabaseOutlined />,
  },
  {
    id: 'components',
    name: '组件',
    icon: <DatabaseOutlined />,
  },
];

export const configSchema = [
  {
    id: 'style',
    name: '样式',
    icon: <DatabaseOutlined />,
    components: Panel,
  },
  {
    id: 'layout',
    name: '布局',
    icon: <DatabaseOutlined />,
    components: Panel,
  },

  {
    id: 'components',
    name: '组件',
    icon: <DatabaseOutlined />,
    components: Panel,
  },
];
