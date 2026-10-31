import * as Sentry from "@sentry/nextjs";

import { getBaseSentryInitOptions } from "./sentry.shared";

Sentry.init({
  ...getBaseSentryInitOptions(),
});
