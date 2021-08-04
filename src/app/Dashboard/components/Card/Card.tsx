import { isNil } from "lodash";
import classNames from "classnames";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/pro-solid-svg-icons";
import { faEllipsisV } from "@fortawesome/pro-light-svg-icons";

import { ShowHide, RenderWithSpinner, Dropdown } from "components";
import { IconButton } from "components/buttons";
import { BudgetCardImage } from "components/images";
import { IDropdownMenuItem } from "components/menus/DropdownMenu";

import "./index.scss";

interface CardProps extends StandardComponentProps {
  dropdown?: IDropdownMenuItem[];
  title: string;
  subTitle?: string;
  image: SavedImage | null;
  loading?: boolean;
  onClick?: () => void;
  hidden?: boolean;
}

const Card = ({
  title,
  subTitle,
  dropdown,
  onClick,
  loading,
  image,
  hidden = false,
  style = {},
  className
}: CardProps): JSX.Element => {
  return (
    <div className={classNames("dashboard-card", className, { hidden })} style={style}>
      <RenderWithSpinner size={18} loading={loading} toggleOpacity={true}>
        <ShowHide show={hidden}>
          <FontAwesomeIcon className={"icon icon--hidden"} icon={faEyeSlash} />
        </ShowHide>
        {!isNil(dropdown) && (
          <Dropdown items={dropdown} placement={"bottomRight"} trigger={["click"]}>
            <IconButton
              className={classNames("dropdown-ellipsis", { "for-placeholder": isNil(image) })}
              icon={<FontAwesomeIcon icon={faEllipsisV} />}
            />
          </Dropdown>
        )}
        <BudgetCardImage image={image} onClick={onClick} titleOnly={isNil(subTitle)} />
        <div className={classNames("dashboard-card-footer", { "title-only": isNil(subTitle) })} onClick={onClick}>
          <div className={"title"}>{title}</div>
          <ShowHide show={!isNil(subTitle)}>
            <div className={"sub-title"}>{subTitle}</div>
          </ShowHide>
        </div>
      </RenderWithSpinner>
    </div>
  );
};

export default Card;
