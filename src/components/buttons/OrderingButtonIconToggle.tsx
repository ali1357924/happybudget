import React, { useMemo } from "react";
import { find } from "lodash";

import { Icon, OrderingArrowIcon } from "components/icons";

import DefaultButtonIconToggle, { DefaultButtonIconToggleProps } from "./DefaultButtonIconToggle";

export interface OrderingButtonIconToggleProps extends Omit<DefaultButtonIconToggleProps, "icon" | "children"> {
  readonly ordering: Http.Ordering;
  readonly labelMap: { [key: string]: string };
}

const OrderingButtonIconToggle = ({ ordering, labelMap, ...props }: OrderingButtonIconToggleProps): JSX.Element => {
  const order = useMemo(() => find(ordering, (o: Http.FieldOrder) => o.order !== 0), [ordering]);

  const label = useMemo(() => {
    return order === undefined ? "Order By" : labelMap[order.field] || "Order By";
  }, [ordering]);

  const sortIcon = useMemo(() => {
    if (order !== undefined) {
      return <OrderingArrowIcon style={{ width: "10px" }} order={order.order} />;
    }
    return <Icon icon={"bars-filter"} weight={"light"} />;
  }, [ordering]);

  return (
    <DefaultButtonIconToggle
      {...props}
      style={{ ...props.style, width: "auto" }}
      breakpointStyle={props.style}
      icon={sortIcon}
      breakpointIcon={<Icon icon={"sort-amount-down"} weight={"regular"} />}
    >
      {label}
    </DefaultButtonIconToggle>
  );
};

export default React.memo(OrderingButtonIconToggle);
