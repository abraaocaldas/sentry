from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Literal

from sentry_protos.snuba.v1.trace_item_attribute_pb2 import AttributeAggregation, AttributeKey

STRING = AttributeKey.TYPE_STRING
BOOLEAN = AttributeKey.TYPE_BOOLEAN
FLOAT = AttributeKey.TYPE_FLOAT
INT = AttributeKey.TYPE_INT


# TODO: we need a datetime type
TYPE_MAP = {
    # TODO:  need to update these to float once the proto supports float arrays
    "number": INT,
    "duration": INT,
    "string": STRING,
}


@dataclass(frozen=True)
class ResolvedColumn:
    # The alias for this column
    public_alias: str  # `p95() as foo` -> `foo` or `p95()` -> `p95()`
    # The internal rpc alias for this column
    rpc_name: str
    # The public type for this column
    search_type: Literal["string", "number", "duration"]
    # Processor is the function run in the post process step to transform data into the final result
    processor: Callable[[Any], Any] | None = None
    # Validator to check if the value in a query is correct
    validator: Callable[[Any], None] | None = None

    def process_column(row: Any) -> None:
        """Pull the column from row, then process it and mutate it"""
        pass

    def validate(self, value: Any) -> None:
        if self.validator is not None:
            self.validator(value)

    @property
    def proto_definition(self) -> AttributeAggregation | AttributeKey:
        """The definition of this function as needed by the RPC"""
        return AttributeKey(name=self.rpc_name, type=TYPE_MAP[self.search_type])


# Temporary, just doing enough of these for now so I can write some tests for resolve_query
SPAN_COLUMN_DEFINITIONS = {
    "id": ResolvedColumn(
        public_alias="id",
        rpc_name="span_id",
        search_type="string",
    ),
    "organization.id": ResolvedColumn(
        public_alias="organization.id", rpc_name="organization_id", search_type="string"
    ),
    "span.action": ResolvedColumn(
        public_alias="span.action",
        rpc_name="action",
        search_type="string",
    ),
    "span.description": ResolvedColumn(
        public_alias="span.description",
        rpc_name="name",
        search_type="string",
    ),
    "span.op": ResolvedColumn(public_alias="span.op", rpc_name="op", search_type="string"),
    "ai.total_tokens.used": ResolvedColumn(
        public_alias="ai.total_tokens.used",
        rpc_name="ai_total_tokens_used",
        search_type="number",
    ),
}
