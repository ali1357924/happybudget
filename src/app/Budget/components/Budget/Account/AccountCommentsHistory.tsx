import { useDispatch, useSelector } from "react-redux";
import { includes, map } from "lodash";

import { redux } from "lib";

import { actions } from "../../../store";
import CommentsHistoryDrawer from "../../CommentsHistoryDrawer";

const selectDeletingComments = redux.selectors.simpleDeepEqualSelector((state: Application.Authenticated.Store) =>
  map(state.budget.account.comments.deleting, (instance: Redux.ModelListActionInstance) => instance.id)
);
const selectEditingComments = redux.selectors.simpleDeepEqualSelector((state: Application.Authenticated.Store) =>
  map(state.budget.account.comments.updating, (instance: Redux.ModelListActionInstance) => instance.id)
);
const selectReplyingComments = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.comments.replying
);
const selectCommentsData = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.comments.data
);
const selectSubmittingComment = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.comments.creating
);
const selectLoadingComments = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.comments.loading
);
const selectLoadingHistory = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.history.loading
);
const selectHistory = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.account.history.data
);

const AccountCommentsHistory = (): JSX.Element => {
  const dispatch = useDispatch();
  const deletingComments = useSelector(selectDeletingComments);
  const editingComments = useSelector(selectEditingComments);
  const replyingComments = useSelector(selectReplyingComments);
  const submittingComment = useSelector(selectSubmittingComment);
  const loadingComments = useSelector(selectLoadingComments);
  const comments = useSelector(selectCommentsData);
  const loadingHistory = useSelector(selectLoadingHistory);
  const history = useSelector(selectHistory);

  return (
    <CommentsHistoryDrawer
      commentsProps={{
        comments: comments,
        loading: loadingComments,
        submitting: submittingComment,
        commentLoading: (comment: Model.Comment) =>
          includes(editingComments, comment.id) ||
          includes(deletingComments, comment.id) ||
          includes(replyingComments, comment.id),
        onRequest: () => dispatch(actions.account.requestCommentsAction(null)),
        onSubmit: (payload: Http.CommentPayload) => dispatch(actions.account.createCommentAction({ data: payload })),
        onDoneEditing: (comment: Model.Comment, value: string) =>
          dispatch(actions.account.updateCommentAction({ id: comment.id, data: { text: value } })),
        onDoneReplying: (comment: Model.Comment, value: string) =>
          dispatch(actions.account.createCommentAction({ parent: comment.id, data: { text: value } })),
        /* eslint-disable no-console */
        onLike: (comment: Model.Comment) => {},
        onDelete: (comment: Model.Comment) => dispatch(actions.account.deleteCommentAction(comment.id))
      }}
      historyProps={{
        history,
        loading: loadingHistory,
        onRequest: () => dispatch(actions.account.requestHistoryAction(null))
      }}
    />
  );
};

export default AccountCommentsHistory;