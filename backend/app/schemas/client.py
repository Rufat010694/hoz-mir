from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime


class ClientCreate(BaseModel):
    phone: str
    full_name: str | None = None
    store_name: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    full_name: str | None = None
    store_name: str | None = None
    notes: str | None = None


class ClientResponse(BaseModel):
    id: str
    phone: str
    full_name: str | None
    store_name: str | None
    notes: str | None
    total_debt: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None
