from sqlalchemy import String, ForeignKey, Integer, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.sql import func
import enum
import decimal


class OrderStatus(str, enum.Enum):
    new = "new"
    processing = "processing"
    ready = "ready"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    transfer = "transfer"
    debt = "debt"
    other = "other"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # For first-time clients (no registration)
    client_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_store: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.new)
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), default=PaymentMethod.cash)
    total_amount: Mapped[decimal.Decimal] = mapped_column(Numeric(12, 2), default=0)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Source: 'catalog' (client link) or 'direct' (seller created)
    source: Mapped[str] = mapped_column(String(20), default="direct")
    catalog_slug: Mapped[str | None] = mapped_column(String(100), nullable=True)  # which store catalog

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="orders")
    client: Mapped["Client | None"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)  # snapshot
    price: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # snapshot
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    subtotal: Mapped[decimal.Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship(back_populates="order_items")
