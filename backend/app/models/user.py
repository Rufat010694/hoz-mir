from sqlalchemy import String, Boolean, Enum as SAEnum, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.sql import func


class UserRole(str, enum.Enum):
    admin = "admin"
    seller = "seller"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.seller)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    store_name: Mapped[str] = mapped_column(String(255), nullable=True)
    catalog_slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=True, index=True)
    telegram_chat_id: Mapped[str] = mapped_column(String(50), nullable=True)
    iin: Mapped[str] = mapped_column(String(20), nullable=True)          # ИИН/БИН для накладной
    storage_used: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    products: Mapped[list["Product"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    clients: Mapped[list["Client"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")
