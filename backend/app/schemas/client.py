from pydantic import BaseModel
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
    id: int
    phone: str
    full_name: str | None
    store_name: str | None
    notes: str | None
    total_debt: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
