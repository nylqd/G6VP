import { extra, utils } from '@antv/gi-sdk';
import info from './info';
import $i18n from '../../i18n';
const { GIAC_CONTENT_METAS, deepClone } = extra;
const metas = deepClone(GIAC_CONTENT_METAS);
metas.GIAC_CONTENT.properties.GIAC_CONTENT.properties.icon.default = info.icon;
metas.GIAC_CONTENT.properties.GIAC_CONTENT.properties.title.default = info.name;

export const SchemaData = {
  name: {
    type: 'string',
    title: $i18n.get({ id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.AlgorithmType', dm: '算法类型' }),
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'PageRank', value: 'pagerank' },
      {
        label: $i18n.get({
          id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.SingleSourceShortestPath',
          dm: '单源最短路径',
        }),
        value: 'sssp',
      },
      { label: 'k-Core', value: 'k_core' },
      { label: 'wcc', value: 'wcc' },
      { label: 'clustering', value: 'clustering' },
      { label: 'eigenvector_centrality', value: 'eigenvector_centrality' },
    ],

    'x-reactions': [
      {
        target: 'delta',
        fulfill: {
          state: {
            visible: '{{$self.value === "pagerank"}}',
          },
        },
      },
      {
        target: 'tolerance',
        fulfill: {
          state: {
            visible: '{{$self.value === "eigenvector_centrality"}}',
          },
        },
      },
      {
        target: 'maxRound',
        fulfill: {
          state: {
            visible: '{{$self.value === "pagerank" || $self.value === "eigenvector_centrality"}}',
          },
        },
      },
      {
        target: 'src',
        fulfill: {
          state: {
            visible: '{{$self.value === "sssp"}}',
          },
        },
      },
      {
        target: 'weight',
        fulfill: {
          state: {
            visible: '{{$self.value === "sssp" || $self.value === "eigenvector_centrality"}}',
          },
        },
      },
      {
        target: 'k',
        fulfill: {
          state: {
            visible: '{{$self.value === "k_core"}}',
          },
        },
      },
    ],
  },
  delta: {
    title: 'delta',
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    default: 0.85,
  },
  maxRound: {
    title: 'maxRound',
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    default: 10,
  },
  weight: {
    title: $i18n.get({ id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.Weight', dm: '权重' }),
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    default: 1,
  },
  tolerance: {
    title: 'tolerance',
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    default: 1,
  },
  k: {
    title: 'k',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  src: {
    title: $i18n.get({ id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.StartPointId', dm: '起点ID' }),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  limit: {
    title: $i18n.get({ id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.LimitedQuantity', dm: '限制数量' }),
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    default: 100,
  },
  sortById: {
    type: 'boolean',
    title: $i18n.get({
      id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.WhetherToSortById',
      dm: '是否根据ID排序',
    }),
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
    default: true,
  },
};

const registerMeta = context => {
  const { services } = context;
  const serviceOptions = utils.getServiceOptions(services, info.services[0]);

  return {
    serviceId: {
      title: $i18n.get({ id: 'graphscope.components.ExecAlgorithmPanel.registerMeta.DataService', dm: '数据服务' }),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: serviceOptions,
      },
      default: 'Mock/GremlinQuery',
    },
    ...SchemaData,
    ...metas,
  };
};

export default registerMeta;
