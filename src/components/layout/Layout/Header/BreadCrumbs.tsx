import React, { ReactNode, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { map, isNil, orderBy, forEach } from "lodash";
import { TooltipPropsWithTitle } from "antd/lib/tooltip";
import classNames from "classnames";

import { Button } from "antd";

import { Dropdown, TooltipWrapper } from "components";

import "./BreadCrumbs.scss";
import { useDynamicCallback } from "lib/hooks";

const isLazyBreadCrumbItem = (item: IBreadCrumbItem | ILazyBreadCrumbItem): item is ILazyBreadCrumbItem => {
  return (item as ILazyBreadCrumbItem).func !== undefined;
};

interface BreadCrumbGenericItemProps extends StandardComponentProps {
  readonly url?: string;
  readonly children: ReactNode;
  readonly tooltip?: TooltipPropsWithTitle;
  readonly primary?: boolean;
  suppressClickBehavior?: boolean;
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const BreadCrumbGenericItem = ({
  className,
  style = {},
  tooltip,
  primary,
  children,
  onClick,
  suppressClickBehavior,
  url
}: BreadCrumbGenericItemProps): JSX.Element => {
  const history = useHistory();
  return (
    <div
      className={classNames("bread-crumb-item", className, { primary })}
      style={style}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (!suppressClickBehavior) {
          if (!isNil(onClick)) {
            onClick(e);
          } else if (!isNil(url)) {
            history.push(url);
          }
        }
      }}
    >
      <TooltipWrapper {...tooltip}>{children}</TooltipWrapper>
    </div>
  );
};

interface BreadCrumbItemProps extends StandardComponentProps {
  readonly item: IBreadCrumbItem;
  readonly primary?: boolean;
}

const BreadCrumbItem = ({ item, ...props }: BreadCrumbItemProps): JSX.Element => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const history = useHistory();

  const renderItem = (i: IBreadCrumbItem) => {
    if (!isNil(i.text)) {
      return i.text;
    } else if (!isNil(i.render)) {
      return i.render({ toggleDropdownVisible: () => setDropdownVisible(!dropdownVisible) });
    }
    return <></>;
  };

  const renderDropdownButton = (i: IBreadCrumbItem) => {
    if (!isNil(i.text)) {
      return (
        <Button className={"btn--caret-simple"} onClick={() => setDropdownVisible(true)}>
          {i.text}
        </Button>
      );
    } else if (!isNil(i.render)) {
      return i.render({ toggleDropdownVisible: () => setDropdownVisible(!dropdownVisible) });
    }
    return <></>;
  };

  return (
    <BreadCrumbGenericItem
      {...props}
      tooltip={item.tooltip}
      url={item.url}
      primary={item.primary}
      suppressClickBehavior={!isNil(item.options) && item.options.length !== 0}
    >
      {!isNil(item.options) && item.options.length !== 0 ? (
        <Dropdown
          visible={dropdownVisible}
          trigger={["click"]}
          items={map(
            orderBy(item.options, (obj: IBreadCrumbItemOption) => obj.id),
            (obj: any) => {
              return (
                <Dropdown.Menu.Item
                  id={obj.id}
                  selected={obj.id === item.id}
                  onClick={() => {
                    setDropdownVisible(false);
                    if (!isNil(obj.url)) {
                      history.push(obj.url);
                    } else if (!isNil(obj.onClick)) {
                      obj.onClick();
                    }
                  }}
                >
                  {renderItem(obj)}
                </Dropdown.Menu.Item>
              );
            }
          )}
        >
          {renderDropdownButton(item)}
        </Dropdown>
      ) : (
        <div className={"text-wrapper"}>{renderItem(item)}</div>
      )}
    </BreadCrumbGenericItem>
  );
};

interface BreadCrumbItemsProps {
  readonly children: JSX.Element[];
}

const BreadCrumbItems = ({ children }: BreadCrumbItemsProps): JSX.Element => {
  if (children.length === 0) {
    return <></>;
  } else {
    return (
      <React.Fragment>
        {map(children, (child: JSX.Element, index: number) => {
          if (index === children.length - 1) {
            return <React.Fragment key={index}>{child}</React.Fragment>;
          } else {
            return (
              <React.Fragment key={index}>
                {child}
                <span className={"slash"}>{"/"}</span>
              </React.Fragment>
            );
          }
        })}
      </React.Fragment>
    );
  }
};

interface BreadCrumbsProps extends StandardComponentProps {
  readonly items?: (IBreadCrumbItem | ILazyBreadCrumbItem)[];
  readonly itemProps?: StandardComponentProps;
  readonly params?: { [key: string]: any };
  readonly children?: JSX.Element[];
}

const BreadCrumbs = ({ items, itemProps, params, children, ...props }: BreadCrumbsProps): JSX.Element => {
  const parametersPresent = useDynamicCallback((item: ILazyBreadCrumbItem): [boolean, { [key: string]: any }] => {
    if ((item.requiredParams.length !== 0 && !isNil(params) && Object.keys(params).length === 0) || isNil(params)) {
      return [false, {}];
    }
    let allRequiredParamsPresent = true;
    let presentParamsObj: { [key: string]: any } = {};
    forEach(item.requiredParams, (param: string) => {
      if (isNil(params[param])) {
        allRequiredParamsPresent = false;
        return false;
      } else {
        presentParamsObj[param] = params[param];
      }
    });
    return [allRequiredParamsPresent, presentParamsObj];
  });

  const preparedItems = useMemo((): IBreadCrumbItem[] | null => {
    if (isNil(items)) {
      return null;
    }
    let transformed: IBreadCrumbItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const item: IBreadCrumbItem | ILazyBreadCrumbItem = items[i];
      if (isLazyBreadCrumbItem(item)) {
        const [allRequiredParamsPresent, presentParamsObj] = parametersPresent(item);
        if (allRequiredParamsPresent === true) {
          const newItems = item.func(presentParamsObj);
          if (Array.isArray(newItems)) {
            transformed = [...transformed, ...newItems];
          } else {
            transformed = [...transformed, newItems];
          }
        }
      } else {
        if (item.visible !== false) {
          transformed.push(item);
        }
      }
    }
    return transformed;
  }, [items, params]);

  if (!isNil(children)) {
    return (
      <div {...props} className={classNames("bread-crumbs", props.className)}>
        <BreadCrumbItems>{children}</BreadCrumbItems>
      </div>
    );
  } else if (!isNil(preparedItems)) {
    return (
      <div {...props} className={classNames("bread-crumbs", props.className)}>
        <BreadCrumbItems>
          {map(preparedItems, (item: IBreadCrumbItem, index: number) => (
            <BreadCrumbItem {...itemProps} key={index} item={item} />
          ))}
        </BreadCrumbItems>
      </div>
    );
  } else {
    return <></>;
  }
};

export default BreadCrumbs;