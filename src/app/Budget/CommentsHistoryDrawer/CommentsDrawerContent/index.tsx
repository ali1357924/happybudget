import React, { useState, useEffect } from "react";

import { Input, Button } from "antd";

import { Drawer } from "components/layout";
import Comments from "./Comments";

import "./index.scss";

export interface CommentsDrawerContentProps {
  loading: boolean;
  comments: IComment[];
  submitting: boolean;
  commentLoading: (comment: IComment) => boolean;
  onSubmit: (payload: Http.ICommentPayload) => void;
  onRequest: () => void;
  onDelete: (comment: IComment) => void;
  onLike: (comment: IComment) => void;
  onDoneEditing: (comment: IComment, value: string) => void;
  onDoneReplying: (comment: IComment, value: string) => void;
}

const CommentsDrawerContent = ({
  comments,
  loading,
  submitting,
  commentLoading,
  onSubmit,
  onRequest,
  onDelete,
  onLike,
  onDoneEditing,
  onDoneReplying
}: CommentsDrawerContentProps): JSX.Element => {
  const [text, setText] = useState("");

  useEffect(() => {
    onRequest();
  }, []);

  return (
    <React.Fragment>
      <Drawer.Content className={"comments-drawer-content"} noPadding>
        <div className={"comments-section"}>
          <Comments
            comments={comments}
            loading={loading}
            commentLoading={commentLoading}
            onDelete={onDelete}
            onLike={onLike}
            onDoneEditing={onDoneEditing}
            onDoneReplying={onDoneReplying}
          />
        </div>
      </Drawer.Content>
      <Drawer.Footer className={"form-section"}>
        <Input.TextArea
          style={{ marginBottom: 10 }}
          maxLength={1028}
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setText(e.target.value);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.code === "Enter" && text.trim() !== "") {
              e.stopPropagation();
              onSubmit({ text });
              setText("");
            }
          }}
        />
        <Button
          disabled={text.trim() === ""}
          loading={submitting}
          className={"btn--primary"}
          style={{ width: "100%" }}
          onClick={() => onSubmit({ text })}
        >
          {"Send"}
        </Button>
      </Drawer.Footer>
    </React.Fragment>
  );
};

export default CommentsDrawerContent;
