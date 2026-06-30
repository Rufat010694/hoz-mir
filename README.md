# Хоз Мир — Система управления каталогом и продажами

PWA-приложение для управления товарами, ценами, заказами и клиентами.

## Технологический стек

| Слой | Технологии |
|------|------------|
| Frontend | React + TypeScript + Vite + PWA |
| Backend | FastAPI (Python) |
| База данных | PostgreSQL |
| Кэш / Real-time | Redis + WebSocket |
| Хранение фото | Backblaze B2 (S3) |
| Уведомления | Telegram Bot (опционально) |
| Деплой | Docker Compose + Nginx |

## Быстрый старт (разработка)

### 1. Настройка окружения

```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте backend/.env — заполните ключи B2, Telegram и т.д.

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Запуск через Docker Compose

```bash
docker-compose up -d
```

Сервисы:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Применить миграции БД

```bash
docker-compose exec backend alembic upgrade head
```

### 4. Создать первого пользователя (администратора)

```bash
docker-compose exec backend python -c "
import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password
import secrets, string

async def create_admin():
    slug = 'my-store-' + ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    async with AsyncSessionLocal() as db:
        user = User(
            username='admin',
            hashed_password=hash_password('admin123'),
            role=UserRole.admin,
            store_name='Мой Магазин',
            catalog_slug=slug,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print(f'✅ Создан admin / admin123')
        print(f'🔗 Каталог: http://localhost:5173/catalog/{slug}')

asyncio.run(create_admin())
"
```

## Структура проекта

```
Хоз Мир/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # Точка входа
│   │   ├── config.py        # Настройки
│   │   ├── database.py      # SQLAlchemy
│   │   ├── models/          # Модели БД
│   │   ├── schemas/         # Pydantic схемы
│   │   ├── routers/         # API роутеры
│   │   ├── services/        # Бизнес-логика
│   │   └── websocket/       # WebSocket менеджер
│   ├── alembic/             # Миграции
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React PWA
│   ├── src/
│   │   ├── api/             # API клиент
│   │   ├── components/      # UI компоненты
│   │   ├── pages/
│   │   │   ├── seller/      # Панель продавца
│   │   │   └── catalog/     # Публичный каталог
│   │   ├── store/           # Zustand state
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/
│   └── package.json
├── nginx/                   # Nginx конфиг
├── docker-compose.yml       # Dev конфиг
├── docker-compose.prod.yml  # Prod конфиг
└── README.md
```

## Роли и права

| Роль | Доступ |
|------|--------|
| `admin` | Полный доступ ко всем функциям |
| `seller` | Управление своими товарами, заказами, клиентами |

## Публичный каталог

Каждый продавец получает уникальную ссылку:
```
https://yourdomain.com/catalog/<slug>
```

Клиенты могут:
- Просматривать товары и категории
- Добавлять в корзину
- Оформлять заказ без регистрации (только телефон)

## Производственный деплой

```bash
# Заполнить prod переменные
cp backend/.env.example backend/.env
# Установить POSTGRES_PASSWORD, SECRET_KEY, B2 ключи и т.д.

docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## API Документация

После запуска: http://localhost:8000/api/docs
