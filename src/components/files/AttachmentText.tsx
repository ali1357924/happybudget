import React from "react";
import classNames from "classnames";
import { isNil } from "lodash";

import FileIcon from "./FileIcon";
import "./AttachmentText.scss";

export interface AttachmentTextProps extends StandardComponentProps {
  readonly children: Model.Attachment | Model.SimpleAttachment;
  readonly additionalCount?: number;
}

const AttachmentText: React.FC<AttachmentTextProps> = ({ children, additionalCount, ...props }) => {
  return (
    <div {...props} className={classNames("attachment-text", props.className)}>
      <div className={"icon-wrapper"} style={{ marginRight: 4 }}>
        <FileIcon className={"icon--attachment"} name={children.name} ext={children.extension} />
      </div>
      <div className={"content-text"}>{children.name}</div>
      {!isNil(additionalCount) && additionalCount !== 0 && (
        <div className={"additional-count"}>{`(${additionalCount} more...)`}</div>
      )}
    </div>
  );
};

export default AttachmentText;
