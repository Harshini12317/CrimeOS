from sqlalchemy.types import UserDefinedType


class Vector(UserDefinedType):
    """A lightweight PostgreSQL vector type for embedding columns."""

    cache_ok = True

    def __init__(self, dimensions: int = 1024) -> None:
        self.dimensions = dimensions

    def get_col_spec(self, **kw) -> str:
        return f"VECTOR({self.dimensions})"

    def copy(self, **kw):
        return Vector(dimensions=self.dimensions)
