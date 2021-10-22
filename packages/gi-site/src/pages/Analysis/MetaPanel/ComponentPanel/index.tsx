import GUI from '@ali/react-datav-gui';
import React, { useState } from 'react';
import Group from '../../../../components/DataVGui/Group';

const extensions = {
  group: Group,
  test: Group,
};
import AssetsCenterHandler from '../../../../components/AssetsCenter/AssetsCenterHandler';

/** 根据用户的组件Meta信息，得到默认的defaultvalue值 */
const getDefaultValues = meta => {
  const { children } = meta;
  const keys = Object.keys(children);
  const values = {};
  keys.forEach(key => {
    const { default: defaultValue } = children[key];
    values[key] = defaultValue;
  });
  return values;
};

const getComponentsByMap = componentMap => {
  const componentKeys = Object.keys(componentMap);
  return componentKeys.map(id => {
    const props = componentMap[id];
    const { giEnable } = props;
    return {
      id,
      props,
      enable: giEnable,
    };
  });
};

/** 组件模块 配置面板 */
const ComponentPanel = props => {
  const { value, onChange, data, config, meta, services, dispatch, components } = props;

  const { components: choosedComponents } = config;

  const [state, setState] = useState({
    isModalVisible: false,
  });

  /** 手动构建ConfigObject信息 */
  const configObj = {};
  const valueObj = {};

  components.forEach(component => {
    const { id, meta, props } = component;
    const defaultFunction = params => {
      return {
        categoryId: 'components',
        id: id,
        type: 'group', //这个可以不写
        fold: false, // 这个可以不写
        name: id,
        children: {},
      };
    };
    const defaultComponent = components.find(c => c.id === id);
    if (!defaultComponent) {
      return;
    }
    const { meta: defaultConfigObj, props: defaultProps, name: defaultName } = defaultComponent;

    valueObj[id] = {
      ...props,
      ...defaultProps,
    };

    configObj[id] = {
      name: defaultName,
      type: 'group',
      fold: false,
      children: {
        ...meta,
        ...defaultConfigObj,
      },
    };
  });

  const handleChange = e => {
    const { rootValue } = e;
    const com = getComponentsByMap(rootValue);

    dispatch({
      type: 'update:config:components',
      components: com,
    });
  };

  console.log('XXXX', configObj, valueObj);

  return (
    <div>
      <AssetsCenterHandler title="组件" id="components" />
      <GUI configObj={configObj} valueObj={valueObj} onChange={handleChange} extensions={extensions} />
    </div>
  );
};

export default ComponentPanel;
