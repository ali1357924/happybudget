import React from "react";
import { isNil } from "lodash";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";

import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/lib/checkbox";

import { Dropdown } from "components/control";
import { IconButton } from "components/control/buttons";
import { ShowHide, RenderWithSpinner } from "components/display";
import {
  ActorsIcon,
  DirectorIcon,
  DollyIcon,
  EditorIcon,
  SceneIcon,
  SFXIcon,
  SoundIcon,
  WriterIcon
} from "components/svgs";
import { selectRandom } from "util/arrays";
import "./Card.scss";

export const Icons: (() => JSX.Element)[] = [
  ActorsIcon,
  DirectorIcon,
  DollyIcon,
  EditorIcon,
  SceneIcon,
  SFXIcon,
  SoundIcon,
  WriterIcon
];

export const Colors: string[] = [
  "#8688A8",
  "#8688A8",
  "#B27FAA",
  "#57AD71",
  "#FFD752",
  "#C17F73",
  "#AD5757",
  "#50C4BB",
  "#80A1DE"
];

interface CardProps {
  dropdown?: IMenuItem[];
  selected?: boolean;
  title?: string;
  subTitle?: string;
  loading?: boolean;
  onClick?: () => void;
  onSelect?: (checked: boolean) => void;
}

const Card = ({ title, subTitle, dropdown, onClick, loading, selected = false, onSelect }: CardProps): JSX.Element => {
  const Icon = selectRandom(Icons);
  return (
    <div className={"budget-card"}>
      <RenderWithSpinner loading={loading}>
        <React.Fragment>
          <Checkbox
            className={"card-checkbox"}
            checked={selected}
            onChange={(e: CheckboxChangeEvent) => {
              if (!isNil(onSelect)) {
                onSelect(e.target.checked);
              }
            }}
          />
          {!isNil(dropdown) && (
            <Dropdown items={dropdown}>
              <IconButton className={"card-dropdown-ellipsis"} icon={<FontAwesomeIcon icon={faEllipsisV} />} />
            </Dropdown>
          )}
          <div
            className={"budget-card-icon-wrapper"}
            onClick={onClick}
            style={{ backgroundColor: selectRandom(Colors) }}
          >
            <Icon />
          </div>
          <div className={"budget-card-footer"} onClick={onClick}>
            <ShowHide show={!isNil(title)}>
              <div className={"title"}>{title}</div>
            </ShowHide>
            <ShowHide show={!isNil(subTitle)}>
              <div className={"subTitle"}>{subTitle}</div>
            </ShowHide>
          </div>
        </React.Fragment>
      </RenderWithSpinner>
    </div>
  );
};

export default Card;
