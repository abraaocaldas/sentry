import logging
from enum import IntEnum

from sentry.utils.hashlib import md5_text


class EventStageStatus(IntEnum):
    REDIS_PUT = 1
    """
    redis_put

    save_event_started

    save_event_finished

    snuba_topic_put

    commit_log_topic_put

    ppf_topic_put

    post_process_started

    post_process_finished / the same as redis_deleted
    """


logger = logging.getLogger("EventTracker")


def is_sampled_to_track(event_id: str, sample_rate: float = 0.01) -> bool:
    """
    Normalize the integer to a float in the range [0, 1)
    The md5 hashing algorithm is consistent and will make sure the same event_id's are sampled,
    and provide all or nothing logging.
    """
    hash_float = int(md5_text(event_id).hexdigest(), 16) / (2**128 - 1)
    if hash_float < sample_rate:
        return True
    return False


def record_sampled_event_stage_status(
    event_id: str, status: EventStageStatus, is_sampled_to_track: bool = False
) -> None:
    """
    Records how far an event has made it through the ingestion pipeline.
    """
    if is_sampled_to_track:
        print("in if")
        extra = {"event_id": event_id, "status": status}
        logger.info("EventTracker.recorded", extra=extra)
