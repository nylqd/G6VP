// @ts-nocheck

import { Service } from 'egg';

import gremlin from 'gremlin_patch';
import BigNumber from 'bignumber.js';
// @ts-ignore
import FormStream from 'formstream';
import fs from 'fs';
import { readGraphScopeConfig } from '../util';

interface ConnectProps {
  engineServerURL: string;
  httpServerURL: string;
}

/**
 * 初始化 Gremlin 客户端，支持通过 Gremlin 语句查询
 * @param gremlinServer Endpoint of gremlin server
 * @param account Authenticator of gremlin server
 */
function initGremlinClient(gremlinServer: string, account = { username: '', password: '' }) {
  if (!account.hasOwnProperty('username') || !account.hasOwnProperty('password')) {
    throw new Error('Authenticator failed: username or password not exists.');
  }
  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(account.username, account.password);
  const client = new gremlin.driver.Client(gremlinServer, {
    traversalSource: 'g',
    authenticator,
  });

  console.log(`Gremlin client init on server ${gremlinServer}`);
  return client;
}

function closeGremlinClient(client): void {
  console.log('Gremlin client close');
  try {
    client.close();
  } catch (error) {}
}

class GraphComputeService extends Service {
  async connectGraphScope(params: ConnectProps) {
    fs.writeFileSync(`${__dirname}/GRAPHSCOPE_CONFIG.json`, JSON.stringify(params, null, 2), 'utf-8');
    return {
      success: true,
      data: params,
      code: 200,
    };
  }

  /**
   * Whether the value was generated by GraphScope pathExpand operator.
   * https://graphscope.io/docs/interactive_engine/tinkerpop/supported_gremlin_steps#pathexpand
   * @param value: the result fetching from the gremlin server
   */
  isGSExpandPath(value) {
    if (! value instanceof Array) {
      return false;
    }
    try {
      let isGSPath = true;
      let hasEdge = false;
      for (const current of value) {
        // the result of PathExpand operator is a path consisting of a set of vertex and edge
        isGSPath &&= current instanceof gremlin.structure.Vertex || current instanceof gremlin.structure.Edge;
        // edgeInfo is needed for graph visualization
        if (current instanceof gremlin.structure.Edge) {
          hasEdge = true;
        }
      }
      return isGSPath && hasEdge;
    } catch (error) {
      return false;
    }
    return false;
  }

  /**
   * Convert gremlin vertex/edge data structure into js object.
   * @param client: gremlin client
   * @param value: gremlin data structure
   */
  async jsonGraphData(client, value) {
    const obj = {};
    const { id, label, properties } = value;
    // id, label
    obj.id = `${id}`;
    obj.label = label;
    // properties
    if (properties) {
      // general gremlin standard
      const elementProp = {};
      for (const key in properties) {
        const currentProp = properties[key];
        if (currentProp && currentProp[0]) {
          elementProp[`${key}`] = currentProp[0].value;
        }
      }
      obj.data = elementProp;
    }
    // edge also need src/dst information
    if (value instanceof gremlin.structure.Edge) {
      const { inV, outV } = value;
      obj.inV = await this.jsonGraphData(client, inV);
      obj.outV = await this.jsonGraphData(client, outV);
    }
    return obj;
  }

  /**
   * Private function to handle vertex.
   * @param client: gremlin client
   * @param nodeItemsMapping: {vertexId: object}
   * @param nodeIds: [vertexId], used to query vertex property in batch
   * @param value: gremlin vertex data structure
   */
  async handleVertexMapping(client, nodeItemsMapping, nodeIds, value) {
    const vertexInfo = await this.jsonGraphData(client, value);
    nodeItemsMapping[vertexInfo.id] = {
      ...vertexInfo,
      nodeType: vertexInfo.label,
    };
    nodeIds.add(vertexInfo.id);
  }

  /**
   * Private function to handle edge.
   * @param client: gremlin client
   * @param nodeItemsMapping: {vertexId: object}
   * @param edgeItemsMapping: {edgeId: object}
   * @param nodeIds: [vertexId], used to query vertex property in batch
   * @param value: gremlin edge data structure
   */
  async handleEdgeMapping(client, nodeItemsMapping, edgeItemsMapping, nodeIds, value) {
      const edgeInfo = await this.jsonGraphData(client, value);
      const srcVertexInfo = edgeInfo.outV;
      const dstVertexInfo = edgeInfo.inV;
      // edge
      edgeItemsMapping[edgeInfo.id] = {
        ...edgeInfo,
        edgeType: edgeInfo.label,
        source: srcVertexInfo.id,
        target: dstVertexInfo.id,
      };
      // source vertex
      nodeItemsMapping[srcVertexInfo.id] = {
        ...srcVertexInfo,
        nodeType: srcVertexInfo.label,
      };
      nodeIds.add(srcVertexInfo.id);
      // destination vertex
      nodeItemsMapping[dstVertexInfo.id] = {
        ...dstVertexInfo,
        nodeType: dstVertexInfo.label,
      };
      nodeIds.add(dstVertexInfo.id);
  }

  /**
   * Private function to handle table result
   * @param client: gremlin client
   * @param tableResult: any[]
   * @param value: gremlin data structure
   */
  async handleTableResult(client, tableResult, value) {
    const entries = value.entries();
    const currentObj = {} as any;
    for (const current of entries) {
      let [key, v] = current;
      if (key instanceof gremlin.process.EnumValue) {
        // `elementMap()`
        key = `~${key.elementName}`;
      }
      if (typeof v === 'number') {
        currentObj[key] = v;
      } else if (v instanceof gremlin.structure.Vertex || v instanceof gremlin.structure.Edge) {
        currentObj[key] = await this.jsonGraphData(client, v);
      } else {
        currentObj[key] = JSON.stringify(v);
      }
    }
    tableResult.push(currentObj);
  }

  /**
   * Query the properties of nodes in batch.
   * @param client: The gremlin client
   * @param nodeIds: List of node's id
   */
  async queryNodesProperties(client, nodeIds) {
    // { id: properties }
    const propertiesMap = {};
    if (!nodeIds || nodeIds.length === 0) {
      return propertiesMap;
    }
    // gremlin
    const gremlinCode = `g.V(${nodeIds.join(',')}).elementMap()`;
    console.log(`Execute query ${gremlinCode}`);
    const allVertexPropertyResult = await client.submit(gremlinCode);
    // parse result
    for (let properties of allVertexPropertyResult) {
      // Map(4) {
      //   EnumValue { typeName: 'T', elementName: 'label' } => 'software',
      //   EnumValue { typeName: 'T', elementName: 'id' } => BigNumber { s: -1, e: 18, c: [ 81562, 17893511750342 ] },
      //   'id' => 10,
      //   'name' => 'gremlin'
      // }
      let nodeId = null;
      const entries = properties.entries();
      const currentObj = {};
      for (const current of entries) {
        const [key, value] = current;
        if (key instanceof gremlin.process.EnumValue) {
          // EnumValue represents the id and label
          if (key.elementName === 'id') {
            nodeId = value;
          }
        } else {
          // actually properties
          currentObj[key] = value;
        }
      }
      propertiesMap[nodeId] = currentObj;
    }
    return propertiesMap;
  }

  /**
   * Query the properties of edges in batch.
   * @param client: The gremlin client
   * @param edgeIds: List of edge's id
   */
  async queryEdgesProperties(client, edgeIds) {
    // TODO: Query edge properties isn't support in GraphScope yet.
    // Need to consider the dummy edge of PathExpand operator.
    const propertiesMap = {};
    return propertiesMap;
  }

  /**
   * Query with gremlin statement
   * @param params: gremlin code, server info, and account info for authentication.
   */
  async queryByGremlinLanguage(params) {
    const { value: gremlinCode, gremlinServer, graphScopeAccount } = params;
    console.log(`Execute query ${gremlinCode} on server ${gremlinServer}`);

    // init gremlin client
    const client = initGremlinClient(gremlinServer, graphScopeAccount);

    let result = [];
    try {
      result = await client.submit(gremlinCode);
    } catch (error) {
      // close gremlin client
      closeGremlinClient(client);
      return {
        success: false,
        code: 200,
        message: `Gremlin 查询失败。${error}`,
        data: {
          nodes: [],
          edges: [],
        },
      };
    }

    let mode = 'graph';
    const tableResult: any[] = [];

    const edgeItemsMapping = {};
    const nodeItemsMapping = {};
    const nodeIds = new Set();
    for (const value of result) {
      if (value instanceof gremlin.structure.Vertex) {
        await this.handleVertexMapping(client, nodeItemsMapping, nodeIds, value);
      } else if (value instanceof gremlin.structure.Edge) {
        await this.handleEdgeMapping(client, nodeItemsMapping, edgeItemsMapping, nodeIds, value);
      } else if (value instanceof gremlin.structure.Path) {
        // path isn't supported in graphscope yet.
        // https://graphscope.io/docs/interactive_engine/tinkerpop/supported_gremlin_steps
        // TODO: waiting for GIE engine.
      } else if (this.isGSExpandPath(value)) {
        for (const current of value) {
          if (current instanceof gremlin.structure.Vertex) {
            await this.handleVertexMapping(client, nodeItemsMapping, nodeIds, current);
          } else {
            await this.handleEdgeMapping(client, nodeItemsMapping, edgeItemsMapping, nodeIds, current);
          }
        }
        // also set tableResult
        await this.handleTableResult(client, tableResult, value);
      } else {
        mode = 'table';
        if (typeof value === 'number' || typeof value === 'string' || value instanceof BigNumber) {
          // e.g. `g.V().count()`, `g.V().id()`, `g.V().label()`
          tableResult.push(value);
        } else {
          // e.g. `valueMap()`, `elementMap()`, `expandPath()`
          // https://graphscope.io/docs/interactive_engine/tinkerpop/supported_gremlin_steps
          await this.handleTableResult(client, tableResult, value);
        }
      }
    }

    // query properties in batch
    if (mode === 'graph') {
      // now graphscope only support to query properties of vertex
      const vertexPropertyMap = await this.queryNodesProperties(client, [...nodeIds]);
      for (let key in vertexPropertyMap) {
        if (key in nodeItemsMapping) {
          nodeItemsMapping[key].data = vertexPropertyMap[key];
        }
      }
    }

    // close gremlin client
    closeGremlinClient(client);

    if (mode === 'graph') {
      // convert map into arraylist
      const nodes = [];
      const edges = [];
      for (const nodeKey in nodeItemsMapping) {
        nodes.push(nodeItemsMapping[nodeKey]);
      }
      for (const edgeKey in edgeItemsMapping) {
        edges.push(edgeItemsMapping[edgeKey]);
      }
      return {
        success: true,
        code: 200,
        message: 'Gremlin 查询成功',
        mode,
        data: {
          nodes,
          edges,
          mode,
          tableResult,
        },
      };
    }
    // table mode
    return {
      success: true,
      code: 200,
      message: 'Gremlin 查询成功',
      mode,
      data: {
        nodes: [],
        edges: [],
        mode,
        tableResult,
      },
    };
  }

  /**
   * query neighbors of vertex.
   * @param params: list of vertex's id, hop info, gremlin server info.
   */
  async queryNeighbors(params) {
    const { id = [], sep, gremlinServer, graphScopeAccount } = params;
    // multi-hop query
    let hops = '';
    for (let i = 0; i < sep - 1; i++) {
      hops += '.both()';
    }
    // init gremlin client
    const client = initGremlinClient(gremlinServer, graphScopeAccount);
    // gremlin query with limits 600
    const gremlinSQL = `g.V(${id.join(',')})${hops}.bothE().limit(600)`;
    const result = await client.submit(gremlinSQL);

    const edgeItemsMapping = {};
    const nodeItemsMapping = {};
    for (const value of result) {
      if (value instanceof gremlin.structure.Edge) {
        // value always edge
        const edgeInfo = await this.jsonGraphData(client, value);
        const srcVertexInfo = edgeInfo.outV;
        const dstVertexInfo = edgeInfo.inV;
        // edge
        edgeItemsMapping[edgeInfo.id] = {
          ...edgeInfo,
          edgeType: edgeInfo.label,
          source: srcVertexInfo.id,
          target: dstVertexInfo.id,
        };
        // source vertex
        nodeItemsMapping[srcVertexInfo.id] = {
          ...srcVertexInfo,
          nodeType: srcVertexInfo.label,
        };
        // destination vertex
        nodeItemsMapping[dstVertexInfo.id] = {
          ...dstVertexInfo,
          nodeType: dstVertexInfo.label,
        };
      }
    }
    // close gremlin client
    closeGremlinClient(client);
    //  convert map into arraylist
    const nodes = [];
    const edges = [];
    for (const nodeKey in nodeItemsMapping) {
      nodes.push(nodeItemsMapping[nodeKey]);
    }
    for (const edgeKey in edgeItemsMapping) {
      edges.push(edgeItemsMapping[edgeKey]);
    }
    return {
      success: true,
      code: 200,
      message: '邻居查询成功',
      data: {
        nodes,
        edges,
      },
    };
  }

  /**
   * Query properties of vertex/edge.
   * @param params list of id to be queried.
   */
  async queryElementProperties(params) {
    const { id = [], type, gremlinServer, graphScopeAccount } = params;

    const client = initGremlinClient(gremlinServer, graphScopeAccount);
    // 'edge' or 'vertex'
    let properties = null;
    if (type === 'edge') {
      properties = await this.queryEdgesProperties(client, id);
    } else {
      // vertex
      properties = await this.queryNodesProperties(client, id);
    }
    closeGremlinClient(client);

    return {
      success: true,
      code: 200,
      message: '属性查询成功',
      data: properties,
    };
  }

  // 分布式暂时不支持，但保留
  /**
   * 执行 GraphScope 图算法
   * @param params 算法参数
   */
  async execAlgorithm(params) {
    const {
      name,
      graphName,
      colomnName,
      maxRound = 10,
      limit = 100,
      sortById,
      vertex_label,
      edge_label,
      delta = 0.85,
      weight = 1,
      src,
      tolerance,
      k,
    } = params;

    // 根据不同算法类型，过滤不需要的参数
    const algorithmParams = {
      name,
      limit,
      sortById,
      vertex_label,
      edge_label,
      graph_name: graphName,
    };
    if (name === 'pagerank') {
      algorithmParams.delta = delta;
    }

    if (name === 'pagerank' || name === 'lpa' || name === 'eigenvector_centrality') {
      algorithmParams.max_round = maxRound;
    }

    if (name === 'eigenvector_centrality') {
      algorithmParams.tolerance = tolerance;
    }

    if (name === 'sssp') {
      algorithmParams.weight = weight;
      algorithmParams.src = src;
    }

    if (name === 'k_core') {
      algorithmParams.k = k;
    }

    console.log('执行图算法参数', algorithmParams);
    const { engineServerURL } = readGraphScopeConfig();

    const result = await this.ctx.curl(`${engineServerURL}/api/graphservice/algorithm`, {
      method: 'GET',
      data: algorithmParams,
      timeout: [10000, 30000],
      dataType: 'json',
    });

    if (!result || !result.data) {
      return result;
    }

    const { result: algorithmResult, code, success, message, context_name } = result.data;

    // 算法执行失败
    if (!success) {
      return result.data;
    }

    const { id: dataIds, result: dataResult } = JSON.parse(algorithmResult);
    const algorithmArr = [];
    for (const key in dataIds) {
      const nodeId = dataIds[key];
      const nodeValue = dataResult[key];
      algorithmArr.push({
        id: nodeId,
        value: nodeValue,
      });
    }

    // 算法执行成功后，将结果写入到数据中，并且更新 Project 中 expandInfo 字段
    const addColumnResult = await this.addColumnToData({
      contextName: context_name,
      colomnName,
      needGremlin: true,
      graphName,
    });

    if (!addColumnResult || !addColumnResult.success) {
      return {};
    }
    const { graph_name, graph_url } = addColumnResult;

    // 算法执行成功，返回结果
    return {
      code,
      success,
      message,
      graphName: graph_name,
      gremlinClientURL: graph_url,
      data: algorithmArr,
    };
  }

  /**
   * 执行算法成功后，将算法结果写到数据指定字段上
   * @param params
   */
  async addColumnToData(params) {
    const { engineServerURL } = readGraphScopeConfig();

    const { graphName, contextName, colomnName, needGremlin } = params;
    const result = await this.ctx.curl(`${engineServerURL}/api/graphservice/addColumn`, {
      method: 'GET',
      data: {
        graph_name: graphName,
        context_name: contextName,
        column_name: colomnName,
        need_gremlin: needGremlin,
      },
      timeout: [10000, 30000],
      dataType: 'json',
    });

    if (!result || !result.data) {
      return result;
    }

    return result.data;
  }

  /**
   * 获取指定引擎的子图列表
   * @param params
   * @returns
   */
  async listSubgraph(params) {
    const { engineServerURL } = readGraphScopeConfig();
    let engineServerHostName = ""

    let result;
    try {
      // replace the 127.0.0.1 of gremlin endpoint with engine server host
      engineServerHostName = new URL(engineServerURL).hostname;
      result = await this.ctx.curl(`${engineServerURL}/api/v1/graph`, {
        method: 'GET',
        data: {
          // @ts-ignore
          // graph_name: graphName,
        },
        dataType: 'json',
      });
    } catch (error) {
      return {
        success: false,
        code: 200,
        message: `子图列表查询失败：${error}`,
      };
    }

    if (!result || !result.data) {
      return {
        success: false,
        code: 200,
        message: `子图列表查询失败：${result}`,
      };
    }

    // replace the 127.0.0.1 of gremlin endpoint with engine server host
    let graphList = JSON.parse(result.data.data);
    for (let g of graphList) {
      g.gremlin_interface.gremlin_endpoint =
        g.gremlin_interface.gremlin_endpoint.replace("127.0.0.1", engineServerHostName);
    }

    return {
      success: true,
      code: 200,
      message: '子图列表查询成功',
      data: JSON.stringify(graphList),
    };
  }
}

export default GraphComputeService;
