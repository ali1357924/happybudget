import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/pro-light-svg-icons";

import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { ShowHide, VerticalFlexCenter } from "components";

import "./SavingChanges.scss";

interface SavingChangesProps {
  saving: boolean;
}

const SavingChanges = ({ saving }: SavingChangesProps): JSX.Element => {
  const loadingIcon = <LoadingOutlined spin />;
  return (
    <div className={"saving-changes"}>
      <VerticalFlexCenter>
        <ShowHide show={saving}>
          <div className={"spinner-wrapper"}>
            <Spin className={"saving-changes-spinner"} indicator={loadingIcon} size={"small"} />
          </div>
        </ShowHide>
        <ShowHide show={!saving}>
          <div className={"check-wrapper"}>
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        </ShowHide>
      </VerticalFlexCenter>
      <div className={"text-container"}>{saving ? "Saving Changes" : "Changes Saved"}</div>
    </div>
  );
};

export default SavingChanges;
