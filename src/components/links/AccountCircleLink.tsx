import { Link } from "react-router-dom";
import { isNil } from "lodash";
import classNames from "classnames";

import { Image } from "components";

import "./AccountCircleLink.scss";

interface AccountCircleLinkProps extends StandardComponentProps {
  user: Model.User | Model.SimpleUser;
}

const AccountCircleLink = ({ className, user, style }: AccountCircleLinkProps): JSX.Element => {
  return (
    <Link to={"#"} className={classNames("account-circle-link", className)} style={style}>
      {!isNil(user.profile_image) ? (
        <Image className={"user-profile-img"} src={user.profile_image} />
      ) : (
        <div className={"user-circle-icon"}>{user.first_name[0] + user.last_name[0]}</div>
      )}
    </Link>
  );
};

export default AccountCircleLink;
