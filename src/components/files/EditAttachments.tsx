import React, { useEffect, useMemo, useState } from "react";
import { filter } from "lodash";

import * as api from "api";
import { redux, notifications } from "lib";

import AttachmentsList from "./AttachmentsList";
import AttachmentsFilePond from "./AttachmentsFilePond";

export interface EditAttachmentsProps {
  readonly id: number;
  readonly path: string;
  readonly onError: (notification: UINotification) => void;
  readonly onAttachmentRemoved?: (id: number) => void;
  readonly onAttachmentAdded?: (m: Model.Attachment) => void;
  readonly listAttachments: (
    id: number,
    query?: Http.ListQuery,
    options?: Http.RequestOptions
  ) => Promise<Http.ListResponse<Model.Attachment>>;
  readonly deleteAttachment: (id: number, objId: number, options?: Http.RequestOptions) => Promise<null>;
}

const EditAttachments = (props: EditAttachmentsProps): JSX.Element => {
  const [isDeleting, setDeleting, setDeleted] = redux.hooks.useTrackModelActions([]);
  const [cancelToken] = api.useCancelToken();
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachments, setAttachments] = useState<Model.Attachment[]>([]);

  useEffect(() => {
    setLoadingAttachments(true);
    props
      .listAttachments(props.id, {}, { cancelToken: cancelToken() })
      .then((response: Http.ListResponse<Model.Attachment>) => setAttachments(response.data))
      .catch((e: Error) => notifications.requestError(e))
      .finally(() => setLoadingAttachments(false));
  }, [props.id]);

  const onAttachmentAdded = useMemo(
    () => (attachment: Model.Attachment) => {
      setAttachments([...attachments, attachment]);
      props.onAttachmentAdded?.(attachment);
    },
    [attachments, props.onAttachmentAdded]
  );

  const onAttachmentRemoved = useMemo(
    () => (id: number) => {
      setAttachments(filter(attachments, (a: Model.Attachment) => a.id !== id));
      props.onAttachmentRemoved?.(id);
    },
    [attachments, props.onAttachmentRemoved]
  );

  const onDelete = useMemo(
    () => (attachment: Model.Attachment) => {
      setDeleting(attachment.id);
      props
        .deleteAttachment(attachment.id, props.id, { cancelToken: cancelToken() })
        .then(() => onAttachmentRemoved(attachment.id))
        .catch((e: Error) => notifications.requestError(e))
        .finally(() => setDeleted(attachment.id));
    },
    [setDeleting, setDeleted]
  );

  return (
    <div className={"edit-attachments"}>
      {attachments.length !== 0 && (
        <AttachmentsList
          className={"mb--15"}
          attachments={attachments}
          loading={loadingAttachments}
          onError={props.onError}
          isDeleting={isDeleting}
          onDelete={onDelete}
          style={{ maxHeight: 400, overflowY: "scroll" }}
        />
      )}
      <AttachmentsFilePond
        id={props.id}
        path={props.path}
        onAttachmentAdded={onAttachmentAdded}
        onAttachmentRemoved={onAttachmentRemoved}
        deleteAttachment={props.deleteAttachment}
      />
    </div>
  );
};

export default React.memo(EditAttachments);
