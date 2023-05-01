import React from "react";
import styles from "./MethodTag.less";
import { HttpMethod } from "@/utils/types";
import { Tag, TagProps } from "antd";

const methodColorMap: Record<HttpMethod, TagProps["color"]> = {
  get: "green",
  post: "blue",
  put: "yellow",
  delete: "red",
  patch: "purple",
  options: "geekblue",
  head: "cyan",
};

export interface MethodTagProps extends TagProps {
  method: HttpMethod;
}

const MethodTag: React.FC<MethodTagProps> = (props) => {
  const { className = "", method, ...otherProps } = props;

  return (
    <Tag className={`${styles.root} ${className}`} color={methodColorMap[method]} {...otherProps}>
      {method.toUpperCase()}
    </Tag>
  );
};

export default MethodTag;
