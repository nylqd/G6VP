import { SubnodeOutlined } from '@ant-design/icons';
import { GraphinContext } from '@antv/graphin';
import { Button, Divider, Modal, Tooltip } from 'antd';
import * as React from 'react';
import ReactDOM from 'react-dom';
import './index.less';

export interface AddNode {
  visible: boolean;
  color: string;
  hasDivider: boolean;
}

const Content = props => {
  const { visible, handleOk, handleCancel } = props;
  const { graph } = React.useContext(GraphinContext);
  console.time('cost selected');
  const selectedNodes = graph.findAllByState('node', 'selected');
  const selectedEdges = graph.findAllByState('edge', 'selected');
  console.timeEnd('cost selected');
  console.log('graph', graph, selectedNodes, selectedEdges);

  return (
    <Modal title="添加节点" visible={visible} onOk={handleOk} onCancel={handleCancel}>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Modal>
  );
};

const AddNode: React.FunctionComponent<AddNode> = props => {
  const { visible: defaultVisible, color, hasDivider } = props;
  const [visible, setVisible] = React.useState(defaultVisible);
  const graphin = React.useContext(GraphinContext);
  React.useEffect(() => {
    setVisible(defaultVisible);
  }, [defaultVisible]);
  const handleClick = () => {
    setVisible(!visible);
    (graphin as any).contextmenu = {};
    console.log('click.........', graphin);
  };

  const handleOk = () => {
    setVisible(false);
  };
  const handleCancel = () => {
    setVisible(false);
  };
  return (
    <div>
      <div onClick={handleClick}>
        <Tooltip title="添加节点" color={color} key={color}>
          <Button type="text" icon={<SubnodeOutlined />}></Button>
        </Tooltip>
        {hasDivider && <Divider type="vertical" />}
      </div>
      {ReactDOM.createPortal(
        <Content visible={visible} handleOk={handleOk} handleCancel={handleCancel} />,
        //@ts-ignore
        document.getElementById('graphin-container'),
      )}
    </div>
  );
};

export default AddNode;