const templateAxios = `import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

export const get = <T>(url: string, config: AxiosRequestConfig) =>
  axios
    .get<T>(url, config)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const post = <T>(url: string, config: AxiosRequestConfig) =>
  axios
    .post<T>(url, config)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const put = <T>(url: string, config: AxiosRequestConfig) =>
  axios
    .put<T>(url, config)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const del = <T>(url: string, config: AxiosRequestConfig) =>
  axios
    .delete<T>(url, config)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });
`;

export default templateAxios;
