import { extra } from '@alipay/graphinsight';
const { GIAC_METAS, deepClone } = extra;
const metas = deepClone(GIAC_METAS);

metas.GIAC.properties.GIAC.properties.title.default = '3D模式';
metas.GIAC.properties.GIAC.properties.isShowTitle.default = false;
metas.GIAC.properties.GIAC.properties.icon.default = 'icon-windows';
metas.GIAC.properties.GIAC.properties.isVertical.default = true;
metas.GIAC.properties.GIAC.properties.tooltipPlacement.default = 'right';
export default () => {
  return {
    visible: {
      type: 'switch',
      name: '默认开启',
      default: false,
    },
    // type: {
    //   type: 'select',
    //   name: '地图类型',
    //   options: [
    //     {
    //       label: '高德',
    //       value: 'amap',
    //     },
    //     {
    //       label: 'MapBox',
    //       value: 'mapbox',
    //     },
    //   ],
    //   default: 'mapbox',
    // },
    // theme: {
    //   type: 'select',
    //   name: '主题',
    //   options: [
    //     {
    //       label: '明亮',
    //       value: 'light',
    //     },
    //     {
    //       label: '黑暗',
    //       value: 'dark',
    //     },

    //     {
    //       label: '普通',
    //       value: 'normal',
    //     },
    //   ],
    //   default: 'light',
    // },
    ...metas,
  };
};
