from typing import Any, TypedDict

import sentry.options
from sentry.quotas.base import QuotaConfig, get_global_abuse_quotas
from sentry.relay.config.measurements import MeasurementsConfig, get_measurements_config
from sentry.utils import metrics

# List of options to include in the global config.
RELAY_OPTIONS: list[str] = [
    "profiling.profile_metrics.unsampled_profiles.platforms",
    "profiling.profile_metrics.unsampled_profiles.sample_rate",
    "profiling.profile_metrics.unsampled_profiles.enabled",
    "relay.span-usage-metric",
    "relay.cardinality-limiter.mode",
    "relay.cardinality-limiter.error-sample-rate",
    "relay.metric-bucket-encodings",
]


class GlobalConfig(TypedDict, total=False):
    measurements: MeasurementsConfig
    quotas: list[QuotaConfig]
    options: dict[str, Any]


@metrics.wraps("relay.globalconfig.get")
def get_global_config():
    """Return the global configuration for Relay."""

    global_config: GlobalConfig = {
        "measurements": get_measurements_config(),
        "quotas": get_global_abuse_quotas(),
    }

    options = dict()
    for option in RELAY_OPTIONS:
        if (value := sentry.options.get(option)) is not None:
            options[option] = value

    if options:
        global_config["options"] = options

    return global_config
