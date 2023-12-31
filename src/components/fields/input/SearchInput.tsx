import React, { forwardRef } from "react";
import { InputRef } from "antd";
import classNames from "classnames";
import { Icon } from "components";
import Input, { InputProps } from "./Input";

export type SearchInputProps = InputProps;

const SearchInput = (props: SearchInputProps, ref: React.ForwardedRef<InputRef>): JSX.Element => (
  <Input
    placeholder={"Search"}
    allowClear={true}
    prefix={<Icon icon={"search"} />}
    {...props}
    ref={ref}
    className={classNames("input--search", props.className)}
  />
);

export default forwardRef(SearchInput);
