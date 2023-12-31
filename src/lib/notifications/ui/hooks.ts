import { useReducer, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import { isNil, filter, map, reduce } from "lodash";

import * as api from "api";
import { util, hooks } from "lib";

import * as internal from "../internal";
import * as typeguards from "./typeguards";
import { combineFieldNotifications, standardizeNotificationData } from "./util";
import { UINotificationReducer } from "./reducers";
import existingNotifications from "./notifications";
import { AddNotificationsDetail, RequestErrorDetail, ClearNotificationsDetail, LookupAndNotifyDetail } from "./base";

type UseNotificationsConfig = {
  readonly defaultClosable?: boolean;
  readonly handleFieldErrors?: (errors: UIFieldNotification[]) => void;
};

export const parseNotifications = (
  notes: SingleOrArray<UINotificationType>,
  opts?: UINotificationOptions & Pick<UseNotificationsConfig, "handleFieldErrors">
): UINotificationData[] => {
  let notices = Array.isArray(notes) ? notes : [notes];

  const fieldRelatedErrors = reduce(
    filter(notices, (n: UINotificationType) => typeguards.isUIFieldNotification(n) || n instanceof api.FieldsError) as (
      | UIFieldNotification
      | api.FieldsError
    )[],
    (curr: UIFieldNotification[], e: api.FieldsError | UIFieldNotification) =>
      e instanceof api.FieldsError ? [...curr, ...e.errors] : [...curr, e],
    []
  );
  // Filter out the notifications that do not pertain to individual fields.
  notices = filter(
    notices,
    (n: UINotificationType) => !typeguards.isUIFieldNotification(n) && !(n instanceof api.FieldsError)
  ) as UINonFieldNotificationType[];
  /* For the notification sources that pertain to field type errors, a
		 callback can be provided that allows for more granular handling of
		 each error pertinent to an individual field.  This is primarily used
		 for Forms, where the field-related errors need to be rendered next
		 to the individual FormItem(s) that are associated with the fields for
		 which an error occurred.  If this callback is not provided, the
		 field-related errors are included in the same scope as the non-field
		 errors.
		 */
  const fieldHandler = opts?.handleFieldErrors;
  if (!isNil(fieldHandler)) {
    fieldHandler(fieldRelatedErrors);
  } else if (fieldRelatedErrors.length !== 0) {
    /* If the fieldHandler is not defined, field related errors will still be
			 in the set of notifications.  If field related errors are submitted in
			 a single batch, we want to group them together into a single
			 notification.

			 The purpose of this is to prevent the dispatching of several UI
			 notifications for a single request error - as a single request error
			 can contain children errors, each of which is an error related to a
			 single field.

			 Note that regardless of the location (index) of the first (or any)
			 field related errors in the array of notifications provided, the field
			 related errors will always come last - at least by the current logic.
			 This should be improved, as the location of the final grouped field
			 related error can be determined from the location of the first child
			 field related error in the array. */
    const combined = combineFieldNotifications(fieldRelatedErrors, opts);
    if (combined !== null) {
      notices = [...notices, combined];
    }
  }
  return reduce(
    notices,
    (curr: UINotificationData[], n: UINotificationType) => {
      const standardized = standardizeNotificationData(n, opts);
      if (standardized !== null) {
        /* All notifications will default to being closable unless either the
				   notification itself defines the closable property or the closable
					 property is provided to the options. */
        const closable =
          standardized.closable !== undefined
            ? standardized.closable
            : opts?.closable !== undefined
            ? opts?.closable
            : true;
        return [...curr, { ...standardized, closable }];
      }
      return curr;
    },
    []
  );
};

export const parseKnownRequestErrorNotifications = (
  e: api.ClientError | api.NetworkError | api.ServerError,
  opts?: UINotificationOptions &
    Pick<UseNotificationsConfig, "handleFieldErrors"> & { readonly dispatchClientErrorToSentry?: boolean }
) => {
  if (e instanceof api.ClientError) {
    /*
		By default, we do not want to dispatch ClientError(s) to Sentry,
		because these are mostly used for control flow and are raised in
		expected cases.  However, there are times that we know we should
		not be getting a ClientError, in which case we should dispatch to
		Sentry.
		*/
    if (opts?.dispatchClientErrorToSentry === true) {
      internal.handleRequestError(e);
    }
    return parseNotifications(e.errors, { message: "There was a problem with your request.", ...opts });
  } else {
    /*
		Dispatch the notification to the internal handler so we can, if
		appropriate, send notifications to Sentry or the console.
		*/
    internal.handleRequestError(e);
    return parseNotifications(e, {
      message: "There was an error with your request.",
      detail: "There was a problem communicating with the server.",
      ...opts
    });
  }
};

export const parseRequestErrorNotifications = (
  e: Error,
  opts?: UINotificationOptions &
    Pick<UseNotificationsConfig, "handleFieldErrors"> & { readonly dispatchClientErrorToSentry?: boolean }
) => {
  if (!axios.isCancel(e) && !(e instanceof api.ForceLogout)) {
    if (e instanceof api.RequestError) {
      return parseKnownRequestErrorNotifications(e, opts);
    } else {
      throw e;
    }
  }
  return [];
};

/**
 * Manages the conversion of notification related objects to notification data
 * for a component.
 *
 * @param config UseNotificationsConfig
 * @returns UINotificationsHandler
 */
export const useNotifications = (config: UseNotificationsConfig): UINotificationsHandler => {
  const getNotifications = useMemo(
    () => (notes: SingleOrArray<UINotificationType>, opts?: UINotificationOptions) => {
      return parseNotifications(notes, {
        ...opts,
        handleFieldErrors: config.handleFieldErrors,
        closable: opts?.closable === undefined ? config.defaultClosable : opts.closable
      });
    },
    [config?.handleFieldErrors, config.defaultClosable]
  );

  return {
    getRequestErrorNotifications: parseKnownRequestErrorNotifications,
    getNotifications
  };
};

type UseNotificationsManagerConfig = UseNotificationsConfig & {
  readonly defaultBehavior: UINotificationBehavior;
};

export const InitialNotificationsManager: UINotificationsManager = {
  notifications: [],
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  clearNotifications: () => {},
  notify: () => [],
  lookupAndNotify: () => [],
  handleRequestError: () => []
};

/**
 * Manages notifications for a component.
 *
 * @param config UseNotificationsManagerConfig
 * @returns UINotificationsManager
 */
export const useNotificationsManager = (config: UseNotificationsManagerConfig): UINotificationsManager => {
  const handler = useNotifications(config);
  const [ns, dispatchNotification] = useReducer(UINotificationReducer, []);
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  const clearNotifications = useMemo(() => (id?: SingleOrArray<UINotification["id"]>) => dispatchNotification(id), []);

  const doTimeout = hooks.useDynamicCallback((fn: () => void, ms: number) => {
    const timeout = setTimeout(fn, ms);
    timeouts.current = [...timeouts.current, timeout];
  });

  useEffect(() => {
    for (let i = 0; i < timeouts.current.length; i++) {
      clearTimeout(timeouts.current[i]);
    }
  }, []);

  const notifications = useMemo(() => {
    return map(ns, (n: Omit<UINotification, "remove">) => ({ ...n, remove: () => clearNotifications(n.id) }));
  }, [clearNotifications, ns]);

  const _notify = useMemo(
    () => (notes: SingleOrArray<UINotificationData>, opts?: UINotificationOptions) => {
      const notificationsToAdd = map(notes, (d: UINotificationData) => {
        const id = util.generateRandomNumericId();
        return {
          ...d,
          id,
          remove: () => clearNotifications(id)
        };
      });
      dispatchNotification({
        notifications: notificationsToAdd,
        opts: { behavior: config.defaultBehavior, ...opts }
      });
      if (!isNil(opts?.duration)) {
        doTimeout(() => clearNotifications(map(notificationsToAdd, (n: UINotification) => n.id)), opts?.duration);
      } else {
        for (let i = 0; i < notificationsToAdd.length; i++) {
          if (notificationsToAdd[i].duration !== undefined) {
            doTimeout(() => clearNotifications(notificationsToAdd[i].id), notificationsToAdd[i].duration);
          }
        }
      }
      return notificationsToAdd;
    },
    [clearNotifications]
  );

  /**
   * Dispatches a single notification or a series of notifications to state.
   * Each notification (of type UINotificationType) is standardized to the
   * consistent UINotification object form and then added to the notifications
   * in state so they can be easily rendered by components using this hook.
   */
  const notify = useMemo(
    () => (notes: SingleOrArray<UINotificationType>, opts?: UINotificationOptions) => {
      const notificationsToAdd = handler.getNotifications(notes, opts);
      return _notify(notificationsToAdd, opts);
    },
    [_notify]
  );

  const lookupAndNotify = useMemo(
    () =>
      <K extends UIExistingNotificationId>(
        id: K,
        params: InferExistingNotificationParams<
          typeof existingNotifications[K]
        > = {} as InferExistingNotificationParams<typeof existingNotifications[K]>
      ) => {
        const notificationData = existingNotifications[id](params);
        return notify(notificationData, { ignoreIfDuplicate: true });
      },
    [notify]
  );

  /**
   * Handles the dispatching of notifications when there is an HTTP request
   * error.  Note that unlike the `notify` method, this will throw the Error
   * if it is not associated with an HTTP error.
   *
   * For convenience, the method will also dispatch an internal notification
   * to the internal notifications handler in order to provide context to
   * Sentry and/or the console.
   */
  const handleRequestError = useMemo(
    () => (e: Error, opts?: UINotificationOptions & { readonly dispatchClientErrorToSentry?: boolean }) => {
      /* Since we are not using the `getNotifications()` method, which would
         convert the notifications to UINotificationData[] and dispatch field
         related errors to the field handler, we must explicitly provide the
         field handler from the hook configuration. */
      const notices = parseRequestErrorNotifications(e, { ...opts, handleFieldErrors: config.handleFieldErrors });
      return _notify(notices);
    },
    []
  );

  return {
    handleRequestError,
    notify,
    clearNotifications,
    lookupAndNotify,
    notifications
  };
};

type UseNotificationsEventListenerConfig = UseNotificationsManagerConfig & {
  readonly destinationId: string;
};

/**
 * Manages notifications for a component via event listeners on the global
 * document object.
 *
 * @param config UseNotificationsEventListenerConfig
 * @returns UINotificationsManager
 */
export const useNotificationsEventListener = (config: UseNotificationsEventListenerConfig): UINotificationsManager => {
  const NotificationsHandler = useNotificationsManager(config);

  useEffect(() => {
    const listener = ((evt: CustomEvent<AddNotificationsDetail>) => {
      NotificationsHandler.notify(evt.detail.notifications, evt.detail.opts);
    }) as EventListener;
    document.addEventListener(`notifications:${config.destinationId}:add`, listener);
    return () => document.removeEventListener(`notifications:${config.destinationId}:add`, listener);
  }, []);

  useEffect(() => {
    const listener = ((evt: CustomEvent<RequestErrorDetail>) => {
      NotificationsHandler.handleRequestError(evt.detail.error, evt.detail.opts);
    }) as EventListener;
    document.addEventListener(`notifications:${config.destinationId}:requestError`, listener);
    return () => document.removeEventListener(`notifications:${config.destinationId}:requestError`, listener);
  }, []);

  useEffect(() => {
    const listener = ((evt: CustomEvent<ClearNotificationsDetail>) => {
      NotificationsHandler.clearNotifications(evt.detail);
    }) as EventListener;
    document.addEventListener(`notifications:${config.destinationId}:clear`, listener);
    return () => document.removeEventListener(`notifications:${config.destinationId}:clear`, listener);
  }, []);

  useEffect(() => {
    const listener = (<K extends UIExistingNotificationId>(evt: CustomEvent<LookupAndNotifyDetail<K>>) => {
      NotificationsHandler.lookupAndNotify(evt.detail.id, evt.detail.params);
    }) as EventListener;
    document.addEventListener(`notifications:${config.destinationId}:lookupAndNotify`, listener);
    return () => document.removeEventListener(`notifications:${config.destinationId}:lookupAndNotify`, listener);
  }, []);

  return NotificationsHandler;
};
