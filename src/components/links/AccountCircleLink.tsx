import { Link } from "react-router-dom";
import classNames from "classnames";

import { UserImageOrInitials } from "components/layout/Layout/images";
import { UserImageOrInitialsProps } from "components/layout/Layout/images/UserImageOrInitials";

import "./AccountCircleLink.scss";

const AccountCircleLink = ({ className, style, ...props }: UserImageOrInitialsProps): JSX.Element => {
  return (
    <Link to={"#"} className={classNames("account-circle-link", className)} style={style}>
      <UserImageOrInitials {...props} />
    </Link>
  );
};

export default AccountCircleLink;
