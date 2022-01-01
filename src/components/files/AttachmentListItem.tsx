import { useState } from "react";
import classNames from "classnames";

import { util, notifications } from "lib";

import { Icon } from "components";
import { IconButton, TrashButton } from "components/buttons";
import { Link } from "components/links";

import Fancybox from "./Fancybox";
import FileIcon from "./FileIcon";

interface AttachmentListItemProps extends StandardComponentProps {
  readonly attachment: Model.Attachment;
  readonly deleting?: boolean;
  readonly onClick?: () => void;
  readonly onError: (notification: UINotificationData) => void;
}

const AttachmentListItem = ({ attachment, deleting, onClick, onError, ...props }: AttachmentListItemProps) => {
  const [downloading, setDownloading] = useState(false);

  return (
    <div {...props} className={classNames("attachment-list-item", props.className, { disabled: deleting })}>
      <div className={"file-action-wrapper"}>
        <FileIcon className={"icon--attachment"} name={attachment.name} ext={attachment.extension} />
      </div>
      <Fancybox options={{ infinite: false }}>
        <Link data-fancybox={"gallery"} data-src={attachment.url} style={{ marginRight: 4 }}>
          {attachment.name}
        </Link>
      </Fancybox>
      <div style={{ display: "flex", flexGrow: 100, justifyContent: "right" }}>
        <div className={"text-wrapper size"}>{util.files.fileSizeString(attachment.size)}</div>
        <div className={"button-action-wrapper"}>
          <IconButton
            disabled={downloading}
            loading={downloading}
            onClick={() => {
              setDownloading(true);
              util.files
                .getDataFromURL(attachment.url)
                .then((response: string | ArrayBuffer) => util.files.download(response, attachment.name))
                .catch((e: Error) => {
                  notifications.notify({
                    error: e,
                    level: "error",
                    dispatchToSentry: true
                  });
                  onError({
                    detail: e,
                    message: "There was an error downloading your attachment."
                  });
                })
                .finally(() => setDownloading(false));
            }}
            icon={<Icon icon={"arrow-circle-down"} weight={"regular"} />}
          />
        </div>
        <div className={"button-action-wrapper"}>
          <TrashButton loading={deleting} disabled={deleting} onClick={() => onClick?.()} />
        </div>
      </div>
    </div>
  );
};

export default AttachmentListItem;
