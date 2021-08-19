import React, { useState } from "react";
import classNames from "classnames";
import { isNil } from "lodash";

import { Icon } from "components";
import Image from "./Image";
import "./BudgetCardImage.scss";

interface BudgetCardImagePlaceholderProps {
  onClick?: () => void;
  titleOnly?: boolean;
}

const BudgetCardImagePlaceholder: React.FC<BudgetCardImagePlaceholderProps> = ({ titleOnly, onClick }) => {
  return (
    <div className={classNames("budget-card-image-placeholder", { "title-only": titleOnly })} onClick={onClick}>
      <Icon icon={"image-polaroid"} weight={"light"} />
    </div>
  );
};

interface BudgetCardImageProps extends BudgetCardImagePlaceholderProps {
  image: SavedImage | null;
  onClick?: () => void;
  titleOnly?: boolean;
}

const BudgetCardImage: React.FC<BudgetCardImageProps> = ({ image, onClick, titleOnly }) => {
  const [loadError, setLoadError] = useState(false);
  if (loadError === false && !isNil(image)) {
    return (
      <Image
        wrapperClassName={classNames("budget-card-image-wrapper", { "title-only": titleOnly })}
        onClick={onClick}
        src={image.url}
        tint={true}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => setLoadError(true)}
      />
    );
  }
  return <BudgetCardImagePlaceholder titleOnly={titleOnly} onClick={onClick} />;
};

export default BudgetCardImage;
