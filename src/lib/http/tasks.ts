import axios from "axios";
import { SagaIterator } from "redux-saga";
import { call, cancelled } from "redux-saga/effects";
import * as Sentry from "@sentry/react";

import { isNil } from "lodash";

import * as api from "api";

const isProvidedRequestConfig = <ARGS extends unknown[]>(arg: ARGS[number]): arg is Http.RequestOptions =>
  typeof arg === "object" &&
  ((arg as Http.RequestOptions).headers !== undefined ||
    (arg as Http.RequestOptions).publicTokenId !== undefined ||
    (arg as Http.RequestOptions).timeout !== undefined);

const handleCancel = (e: Error) => {
  /*
  In the case that the task is cancelled, we do not want to return undefined for
  the response because that will lead to errors in Sentry since the calling logic
  always expect an error to be thrown or the response to be defined.  However,
  we also do not want to dispatch that error to Sentry.
  */
  Sentry.withScope((scope: Sentry.Scope) => {
    scope.setExtra("ignore", true);
    throw e;
  });
};

export function request<R, ARGS extends unknown[], C extends Redux.ActionContext = Redux.ActionContext>(
  service: Http.Service<R, ARGS>,
  ctx?: C,
  ...args: ARGS
) {
  return call<() => SagaIterator<R>>(function* (): SagaIterator {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    let config: Http.RequestOptions = { cancelToken: source.token };
    if (!isNil(ctx?.publicTokenId)) {
      config = { ...config, publicTokenId: ctx?.publicTokenId };
    }

    let callingArgs: ARGS = args;
    const opts = args[args.length - 1];
    if (!isNil(opts) && isProvidedRequestConfig<ARGS>(opts)) {
      callingArgs = [...callingArgs.slice(0, callingArgs.length - 1)] as ARGS;
      /*
      Since we are inserting the request options as the last argument, we have
      to account for optional arguments that may come before the request options
      but were not specified (since they are optional).
      */
      if (callingArgs.length < service.length - 1) {
        while (callingArgs.length < service.length - 1) {
          callingArgs = [...callingArgs, undefined] as ARGS;
        }
      }
      callingArgs = [...callingArgs, { ...opts, ...config }] as ARGS;
    } else {
      /*
      Since we are inserting the request options as the last argument, we have
      to account for optional arguments that may come before the request options
      but were not specified (since they are optional).
      */
      if (callingArgs.length < service.length - 1) {
        while (callingArgs.length < service.length - 1) {
          callingArgs = [...callingArgs, undefined] as ARGS;
        }
      }
      callingArgs = [...callingArgs, config] as ARGS;
    }

    try {
      const result = yield call(service, ...callingArgs);
      return result as R;
    } catch (e: unknown) {
      const err = e as Error;
      if (!(err instanceof api.ForceLogout)) {
        if (!(yield cancelled())) {
          if (!axios.isCancel(err)) {
            throw e;
          }
          handleCancel(err);
        } else {
          console.info("Service was cancelled.");
          handleCancel(err);
        }
      } else {
        handleCancel(err);
      }
    } finally {
      if (yield cancelled()) {
        source.cancel();
      }
    }
  });
}
