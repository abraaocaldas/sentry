from enum import Enum
import logging
import random

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

class EventTracker:
    """
    Logger-based implementation of EventTrackerBackend. The data will be saved in BigQuery using Google Log Sink
    """
    def __init__(self, sample_rate: float = 0.01):
        """
        Args:
            sample_rate (float): The probability (0.0 to 1.0) that an event is recorded.
                                 A value of 1.0 records all events, 0.1 records approximately 10% of events.
        """
        self.logger = logging.getLogger("EventTracker")
        self.sample_rate = sample_rate

    def record_event_stage_status(self, event_id: str, status: EventStageStatus):
        if random.random() > self.sample_rate:
            return
        """
        Records how far an event has made it through the ingestion pipeline.
        """
        self.logger.info(f"EventTracker recorded event {event_id} - {status.value}")
