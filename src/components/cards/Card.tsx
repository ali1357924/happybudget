import React, { useMemo, useState } from "react";

import { isNil } from "lodash";
import classNames from "classnames";

import { Icon, ShowHide, RenderWithSpinner } from "components";
import { IconButton } from "components/buttons";
import { DropdownMenu } from "components/dropdowns";
import { CardImage } from "components/images";
import { TooltipOrTitle } from "components/tooltips";

import "./Card.scss";

export type CardProps = StandardComponentProps & {
  readonly dropdown?: MenuItemModel[];
  readonly title: string;
  readonly subTitle?: string;
  readonly image: SavedImage | null;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly info?: Tooltip;
  readonly onClick?: () => void;
};

const Card = ({
  title,
  subTitle,
  dropdown,
  onClick,
  loading,
  disabled,
  image,
  hidden = false,
  info,
  ...props
}: CardProps): JSX.Element => {
  const [imageError, setImageError] = useState(false);

  const iconClassName = useMemo(() => {
    if (isNil(image) || imageError === true) {
      return "dark";
    }
    return "";
  }, [image, imageError]);

  return (
    <div {...props} className={classNames("card", props.className, { hidden, disabled: loading || disabled, loading })}>
      {!isNil(info) && (
        <TooltipOrTitle type={"info"} tooltip={info}>
          <Icon
            className={classNames("icon--card-info", iconClassName, { "with-hidden": hidden })}
            icon={"question-circle"}
            weight={"solid"}
          />
        </TooltipOrTitle>
      )}

      <div className={"card-inner"}>
        <RenderWithSpinner size={18} loading={loading}>
          <ShowHide show={hidden}>
            <Icon className={"icon--hidden"} icon={"eye-slash"} weight={"solid"} />
          </ShowHide>
          {!isNil(dropdown) && (
            <DropdownMenu models={dropdown} placement={"bottomRight"}>
              <IconButton
                className={classNames("dropdown-ellipsis", iconClassName)}
                icon={<Icon icon={"ellipsis-v"} weight={"light"} />}
              />
            </DropdownMenu>
          )}
          <CardImage
            image={image}
            onClick={disabled ? undefined : onClick}
            titleOnly={isNil(subTitle)}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          <div
            className={classNames("card-footer", { "title-only": isNil(subTitle) })}
            onClick={disabled ? undefined : onClick}
          >
            <div className={"title"}>{title}</div>
            <ShowHide show={!isNil(subTitle)}>
              <div className={"sub-title truncate"}>{subTitle}</div>
            </ShowHide>
          </div>
        </RenderWithSpinner>
      </div>
    </div>
  );
};

export default React.memo(Card);
