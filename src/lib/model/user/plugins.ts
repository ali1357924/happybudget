import moment from "moment-timezone";
import Cookies from "universal-cookie";
import { isNil, find } from "lodash";

import * as config from "config";
import { util } from "lib";

const cookies = new Cookies();

type KeyType = "time" | "user";
type PluginId = "segment" | "canny" | "intercom";

type PluginKeys<K extends string> = { [key in KeyType]: K };

type Plugin<ID extends PluginId, K extends string> = { id: ID; keys: PluginKeys<K>; delayTime: number };

const Plugins: Plugin<PluginId, string>[] = [
  {
    id: "segment",
    delayTime: 15,
    keys: {
      time: "lastIdentifiedSegmentTime",
      user: "lastIdentifiedSegmentUser"
    }
  },
  {
    id: "canny",
    delayTime: 6,
    keys: {
      time: "lastIdentifiedCannyTime",
      user: "lastIdentifiedCannyUser"
    }
  },
  {
    id: "intercom",
    delayTime: 0,
    keys: {
      time: "lastIdentifiedIntercomTime",
      user: "lastIdentifiedIntercomUser"
    }
  }
];

const getPlugin = <ID extends PluginId, K extends string>(id: ID): Plugin<ID, K> =>
  find(Plugins, { id }) as Plugin<ID, K>;

const parseLastIdentifiedUser = (id: PluginId): number | null => {
  const plugin = getPlugin(id);
  const lastIdentifiedUser = cookies.get(plugin.keys.user);
  if (typeof lastIdentifiedUser === "string") {
    const userId = parseInt(lastIdentifiedUser);
    if (!isNaN(userId)) {
      return userId;
    }
  }
  return null;
};

const parseDurationSinceLastIdentify = (id: PluginId, user: Model.User): number | null => {
  const plugin = getPlugin(id);
  const lastIdentifiedTime = cookies.get(plugin.keys.time);
  const now = moment();

  /* Do not log a warning if the date is invalid because it is stored in cookies,
     it can be anything. */
  const lastIdentifiedMmt = util.dates.toLocalizedMoment(lastIdentifiedTime, {
    warnOnInvalid: false,
    tz: user.timezone
  });
  if (!isNil(lastIdentifiedMmt)) {
    return moment.duration(now.diff(lastIdentifiedMmt)).minutes();
  }
  return null;
};

const identifyRequired = (id: PluginId, user: Model.User): boolean => {
  const userId = parseLastIdentifiedUser(id);
  const delta = parseDurationSinceLastIdentify(id, user);
  return isNil(userId) || isNil(delta) || (!isNil(delta) && delta > 6) || (!isNil(userId) && userId !== user.id);
};

const postIdentify = (id: PluginId, user: Model.User) => {
  const plugin = getPlugin(id);
  cookies.set(plugin.keys.user, user.id);
  cookies.set(plugin.keys.time, moment().toISOString());
};

export const identifySegment = (user: Model.User) => {
  if (identifyRequired("segment", user) && config.env.SEGMENT_ENABLED) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    window.analytics.identify(user.id, {
      name: user.full_name,
      email: user.email
    });
    postIdentify("segment", user);
  }
};

/**
 * Uses the Canny SDK to associate the currently logged in user.
 *
 * Canny's API has certain rate limits, and we want to avoid hitting those.
 * The most relevant one is that we cannot send a request to identify a user
 * more than 1 time in 5 minutes, so we make sure that we haven't identified
 * the same user more than 1 time in 6 minutes to be safe.
 *
 * @param user  The currently logged in user.
 */
export const identifyCanny = (user: Model.User) => {
  if (identifyRequired("canny", user)) {
    /* We do not want to makes calls to Canny's API in local development by
       default. */
    if (!isNil(config.env.CANNY_APP_ID)) {
      const userJoined = util.dates.toLocalizedMoment(user.date_joined, {
        warnOnInvalid: false,
        tz: user.timezone
      });
      if (userJoined === undefined) {
        console.warn(
          `Cannot perform canny identification process for user ${user.id} as ` +
            `'date_joined' field (value = '${user.date_joined}') cannot be parsed ` +
            "to a date."
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        window.Canny("identify", {
          appID: config.env.CANNY_APP_ID,
          user: {
            id: user.id,
            email: user.email,
            name: user.full_name,
            avatarURL: user.profile_image?.url,
            created: userJoined.toISOString()
          }
        });
      }
      /* Perform the post identification process regardless of whether or not
         the date was valid in order to not flood Sentry with the same warning
         over and over again. */
      postIdentify("canny", user);
    }
  }
};

export const identifyIntercom = (user: Model.User) => {
  if (identifyRequired("intercom", user)) {
    if (!isNil(config.env.INTERCOM_APP_ID)) {
      const userJoined = util.dates.toLocalizedMoment(user.date_joined, {
        warnOnInvalid: false,
        tz: user.timezone
      });
      if (userJoined === undefined) {
        console.warn(
          `Cannot perform intercom identification process for user ${user.id} as ` +
            `'date_joined' field (value = '${user.date_joined}') cannot be parsed ` +
            "to a date."
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        window.Intercom("boot", {
          app_id: config.env.INTERCOM_APP_ID,
          user_id: user.id,
          email: user.email,
          name: user.full_name,
          created_at: userJoined,
          custom_launcher_selector: "#support-menu-item-intercom-chat"
        });
      }
    }
  }
};

export const identify = (user: Model.User) => {
  identifyCanny(user);
  identifySegment(user);
  identifyIntercom(user);
};
