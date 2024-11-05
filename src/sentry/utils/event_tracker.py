import logging
import random
from enum import Enum


class EventStageStatus(Enum):
    START = "start"
    END = "end"
    REDIS_PUT = "redis_put"
    """
    i plan on adding the below enums for every step of the transactions pipeline
    ingest_consumer_published

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


def is_tracked(sample_rate: float = 0.01) -> bool | None:
    if random.random() > sample_rate:
        return
    return True


def record_event_stage_status(event_id: str, status: EventStageStatus, is_tracked: bool = False):
    """
    Records how far an event has made it through the ingestion pipeline.
    """
    if is_tracked:
        extra = {"event_id": event_id, "status": status.value}
        logger.info("EventTracker.recorded", extra=extra)
