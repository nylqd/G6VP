// import { request } from './utils';
import request from 'umi-request';
import { GI_SITE } from './const';

export const getUser = async () => {
  /**  仅针对内网用户，进行用户访问记录 */
  const response = await request(`${GI_SITE.SERVICE_URL}/user/login`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    credentials: 'include',
    withCredentials: true, // 携带cookie
  });
  if (response.success && response.data) {
    // return response.data;
    const { data } = response;
    return {
      outUserNo: data.staffNo,
      operatorName: data.account,
    };
  }
};