const templateAxios = `import axios from "axios";
import { AxiosRequestConfig } from "axios";

export const get = <T>(
  url: string,
  params: Record<string, any>,
  options?: Omit<AxiosRequestConfig, "params">
) =>
  axios
    .get<T>(url, { ...options, params })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const post = <T>(
  url: string,
  data: Record<string, any> | FormData,
  options?: Omit<AxiosRequestConfig, "data">
) =>
  axios
    .post<T>(url, { ...options, data })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const put = <T>(
  url: string,
  data: Record<string, any>,
  options?: Omit<AxiosRequestConfig, "data">
) =>
  axios
    .put<T>(url, { ...options, data })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });

export const del = <T>(
  url: string,
  params: Record<string, any>,
  options?: Omit<AxiosRequestConfig, "params">
) =>
  axios
    .delete<T>(url, { ...options, params })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });
`;

export default templateAxios;
