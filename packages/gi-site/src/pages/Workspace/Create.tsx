import { EditableProTable } from '@ant-design/pro-table';
import { Button, Form, Input, Modal, Radio } from 'antd';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { addProject } from '../../services';
import { GIDefaultTrans } from '../Analysis/uploadData/const';
import './index.less';
import { activeAssetsKeys, baseConfig, getMockData, schemaData, serviceConfig } from './utils';

interface IProps {
  visible: boolean;
  handleClose: () => void;
}

const SOLUTIONS = [
  {
    id: 'blank',
    name: '空白模版',
    url: 'https://gw.alipayobjects.com/zos/bmw-prod/5e3b4176-a8b5-4a17-ab02-c0c4f3d3933c.svg',
  },
  {
    id: 'financial',
    name: '金融风控',
    url: 'https://gw.alipayobjects.com/zos/bmw-prod/fa575ef2-763e-4a97-8e82-5ba1bd0f5676.svg',
  },
  {
    id: 'enterprise',
    name: '企业风控',
    url: 'https://gw.alipayobjects.com/zos/bmw-prod/1519d32a-dfa5-46fe-9d0e-42c96e831b96.svg',
  },
  {
    id: 'social',
    name: '社交网络',
    url: 'https://gw.alipayobjects.com/zos/bmw-prod/ee827cb1-c523-4f71-bb35-175a1342b670.svg',
  },
  {
    id: 'database',
    name: '图数据库',
    url: 'https://gw.alipayobjects.com/zos/bmw-prod/94237b87-25da-4d8e-8fba-44dd9dbd3301.svg',
  },
];
const GI_ENV = localStorage.getItem('GI_SERVER_ENV');
const CreatePanel: React.FC<IProps> = ({ visible, handleClose }) => {
  const [form] = Form.useForm();
  const history = useHistory();
  const defaultData = [
    {
      name: 'test',
      id: 1,
      state: 'master',
    },
  ];
  const [dataSource, setDataSource] = useState(() => defaultData);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(() => defaultData.map(item => item.id));
  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      width: '40%',
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [{ required: true, message: '此项为必填项' }],
        };
      },
    },
    {
      title: '权限',
      key: 'state',
      dataIndex: 'state',
      valueType: 'select',
      valueEnum: {
        master: { text: 'master' },
        developer: {
          text: '可编辑',
        },
        reporter: {
          text: '仅可见',
        },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 250,
      render: () => null,
    },
  ];

  const onFinish = async () => {
    const value = form.getFieldValue();
    const transData = getMockData();
    const projectId = await addProject({
      name: value.title,
      status: 0, // 0 正常项目， 1删除项目
      tag: value.tag,
      members: dataSource,
      data: JSON.stringify({
        transData,
        inputData: [],
        transfunc: GIDefaultTrans('id', 'source', 'target', 'nodeType', 'edgeType'),
      }),
      projectConfig: JSON.stringify(baseConfig),
      activeAssetsKeys: JSON.stringify(activeAssetsKeys),
      serviceConfig: JSON.stringify(serviceConfig),
      schemaData: JSON.stringify(schemaData),
      type: 'project',
    });

    return projectId;
  };

  const goAnalysis = async () => {
    const projectId = await onFinish();
    history.push(`/workspace/${projectId}?nav=data`);
  };

  const goWorkspace = async () => {
    await onFinish();
    history.push(`/workspace`);
  };

  return (
    <Modal title={'创建项目'} visible={visible} width={846} footer={null} onCancel={handleClose}>
      <Form form={form} labelCol={{ span: 4 }} layout="vertical" initialValues={{ tag: 'Empty' }}>
        <Form.Item label="项目名称" name="title" rules={[{ required: true, message: '请填写用户名' }]}>
          <Input />
        </Form.Item>
        {/* <Form.Item label="成员设置" name="users" > */}
        {GI_ENV === 'ONLINE' && (
          <>
            <span className="form-item">成员设置</span>
            <EditableProTable
              columns={columns}
              value={dataSource}
              rowKey="id"
              recordCreatorProps={{
                creatorButtonText: '添加成员',
                newRecordType: 'dataSource',
                record: () => ({
                  id: dataSource.length + 1,
                }),
              }}
              editable={{
                type: 'multiple',
                editableKeys,
                actionRender: (row, config, defaultDoms) => {
                  return [defaultDoms.delete];
                },
                onValuesChange: (record, recordList) => {
                  setDataSource(recordList);
                },
                onChange: setEditableRowKeys,
              }}
            />
          </>
        )}
        {/* </Form.Item> */}
        <Form.Item label="项目类型" name="tag" className="round">
          <Radio.Group defaultValue="blank" size="small">
            {SOLUTIONS.map(c => {
              return (
                <Radio.Button key={c.id} value={c.id} className="gi-workspace-temp">
                  <img src={c.url} alt="" />
                  <div>{c.name}</div>
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 10, span: 16 }}>
          <Button type="primary" shape="round" onClick={goAnalysis}>
            立即去创建分析
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreatePanel;
