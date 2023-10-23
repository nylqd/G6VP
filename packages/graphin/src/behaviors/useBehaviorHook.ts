import { isEmpty } from 'lodash-es';
import React from 'react';
import { GraphinContext } from '../useGraphin';

interface Props {
  type: string;
  defaultConfig: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProps: any;
  mode?: string;
}

const useBehaviorHook = (params: Props) => {
  const { type, defaultConfig, userProps, mode = 'default' } = params;
  const { graph } = React.useContext(GraphinContext);
  const { disabled, ...otherConfig } = userProps;

  React.useEffect(() => {
    if (!graph || graph.destroyed || isEmpty(graph)) {
      return;
    }
    try {
      /** 保持单例 */
      graph.removeBehaviors([type], mode);
    } catch (error) {}

    if (disabled) {
      return;
    }
    // if (type === 'drag-canvas') {
    //   debugger;
    // }
    graph.addBehaviors(
      {
        type,
        ...defaultConfig,
        ...otherConfig,
      },
      mode,
    );
    return () => {
      if (!graph.destroyed) {
        graph.removeBehaviors([type], mode);
      }
    };
  }, []);
};

export default useBehaviorHook;