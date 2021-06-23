// 配置项见文档 https://yuque.antfin-inc.com/aandm7/aighig/mdrghk
// 分析组件分为两种 分析组件和分析交互
import ColorMapping from '@ali/datav-gui-color-scale';
import SizeMapping from '@ali/datav-gui-size-scale';
import { extractDefault } from '@ali/react-datav-gui-utils';

const configObj = {
  options: {
    name: 'style',
    type: 'menu',
    children: {
      node: {
        name: '节点',
        mode: 'single',

        children: {
          'node-select': {
            name: '节点物料',
            type: 'group',
            enableHide: false,
            fold: false,
            children: {
              font: {
                name: '选择节点',
                type: 'select',
                useFont: true,
                default: 'thenode',
                options: [
                  {
                    value: 'thenode',
                    label: '官方节点',
                  },
                ],
              },
            },
          },
          'size-node': {
            name: '大小',
            type: 'group',
            enableHide: false,
            fold: false,
            children: {
              channel: {
                name: '映射字段',
                type: 'select',
                useFont: true,
                default: 'amount',
                options: [
                  {
                    value: 'amount',
                    label: 'amount',
                  },
                  {
                    value: 'time',
                    label: 'time',
                  },
                ],
              },
              size: {
                name: '半径',
                type: 'sizeMapping',

                min: 0,
                max: 50,
                step: 1,
                suffix: 'px',
                default: {
                  mapping: true,
                  fixed: 5,
                  scale: {
                    custom: true, // 是否采取自定义映射
                    range: [3, 30], // 值域
                    domain: [0, 1000], // 定义域
                    abnormal: 1,
                  },
                },
              },
            },
          },
          'color-node': {
            name: '颜色',
            type: 'group',
            enableHide: false,
            fold: false,
            children: {
              channel: {
                name: '映射字段',
                type: 'select',
                useFont: true,
                default: 'type',
                options: [
                  {
                    value: 'type',
                    label: 'type',
                  },
                  {
                    value: 'time',
                    label: 'time',
                  },
                  {
                    value: 'name',
                    label: 'name',
                  },
                ],
              },
              color: {
                name: '填充颜色',
                type: 'colorMapping',
                fixedComponents: ['flat'],
                default: {
                  mapping: true,
                  fixed: 'skyblue',
                  scale: {
                    type: 'ordinal',
                    scheme: 'cat-1',
                    custom: false,
                    range: ['#00FF95', '#588ee9'],
                    domain: [],
                    excepted: '#666',
                    abnormal: '#f31200',
                    pin: [false, true],
                  },
                },
              },
            },
          },
        },
      },
      edge: {
        name: '边',
        mode: 'single',
        children: {
          'edge-select': {
            name: '边物料',
            type: 'group',
            fold: false,
            enableHide: false,
            children: {
              edges: {
                name: '选择边',
                type: 'select',
                useFont: true,
                default: 'theedge',
                options: [
                  {
                    value: 'theedge',
                    label: '官方边',
                  },
                  {
                    value: 'graphin-edge',
                    label: 'Graphin内置边',
                  },
                  {
                    value: 'light-edge',
                    label: '浅色边',
                  },
                  {
                    value: 'dark-edge',
                    label: '深色边',
                  },
                ],
              },
            },
          },
          'size-edge': {
            name: '大小',
            type: 'group',
            fold: false,
            enableHide: false,
            children: {
              channel: {
                name: '映射字段',
                type: 'select',
                useFont: true,
                default: 'amount',
                options: [
                  {
                    value: 'amount',
                    label: 'amount',
                  },
                  {
                    value: 'time',
                    label: 'time',
                  },
                ],
              },
              size: {
                name: '半径',
                type: 'sizeMapping',
                min: 0,
                max: 50,
                step: 1,
                suffix: 'px',
                default: {
                  mapping: true,
                  fixed: 5,
                  scale: {
                    custom: true, // 是否采取自定义映射
                    range: [3, 30], // 值域
                    domain: [0, 1000], // 定义域
                    abnormal: 1,
                  },
                },
              },
            },
          },
          'color-edge': {
            name: '颜色',
            type: 'group',
            fold: false,
            enableHide: false,
            children: {
              channel: {
                name: '映射字段',
                type: 'select',
                useFont: true,
                default: 'type',
                options: [
                  {
                    value: 'type',
                    label: 'type',
                  },
                  {
                    value: 'time',
                    label: 'time',
                  },
                  {
                    value: 'name',
                    label: 'name',
                  },
                ],
              },
              color: {
                name: '填充颜色',
                type: 'colorMapping',
                fixedComponents: ['flat'],
                default: {
                  mapping: true,
                  fixed: 'skyblue',
                  scale: {
                    type: 'ordinal',
                    scheme: 'cat-1',
                    custom: false,
                    range: ['#00FF95', '#588ee9'],
                    domain: [],
                    excepted: '#666',
                    abnormal: '#f31200',
                    pin: [false, true],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const valueObj = extractDefault({ config: configObj });
const freeExtensions = {
  sizeMapping: SizeMapping,
  colorMapping: ColorMapping,
};
const props = { configObj, valueObj, freeExtensions };

export default props;