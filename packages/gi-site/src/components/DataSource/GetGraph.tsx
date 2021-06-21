import { Collapse, Tabs } from 'antd';
import localforage from 'localforage';
import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useDispatch, useSelector } from 'react-redux';
import { useRequest } from '@alipay/bigfish';
import { getProjectById, updateProjectById } from '../../services';
import './index.less';
const { Panel } = Collapse;

const { TabPane } = Tabs;

interface DataSourceProps {
  handleClose: () => void;
}
let monacoRef;

const GetGraph: React.FunctionComponent<DataSourceProps> = props => {
  const { handleClose } = props;
 const { id } = useSelector(state => state);
 const {data: project = {}, run } = useRequest(() => {
   return getProjectById(id)
 })
 const { data, services = {} } = project;
 const { getGraphDataTransform } = services;

  const dispatch = useDispatch();

  const editorDidMount = editor => {
    editor.focus();
  };
  const handleSave = () => {
    const model = monacoRef.editor.getModel();
    const value = model.getValue();
    try {
      updateProjectById(id, {
        ...project,
        services: {
          ...project.services,
          getGraphDataTransform: value,
        },
      }).then(() => {
        dispatch({
          type: 'update:key',
          key: Math.random(),
        });
        handleClose && handleClose();
      });

    } catch (error) {
      console.log(error);
    }
  };
  React.useEffect(() => { 
    run(); 
  }, [])

  return (
    <div>
      <button onClick={handleSave}>初始化接口：在此可以完成初始化数据的过滤，筛选，转化等任务</button>
      <MonacoEditor
        ref={node => {
          monacoRef = node;
        }}
        width="calc(80vh - 100px)"
        height="80vh"
        language="json"
        theme="vs-dark"
        value={getGraphDataTransform}
        options={{}}
        editorDidMount={editorDidMount}
      />
    </div>
  );
};

export default GetGraph;
