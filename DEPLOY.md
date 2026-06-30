# Деплой Хоз Мир

## Архитектура

```
Vercel (фронтенд)  →  Railway (FastAPI + Redis)  →  CockroachDB + Backblaze B2
```

---

## ШАГ 1 — CockroachDB

1. Зайди на https://cockroachlabs.com → Sign in
2. Create Cluster → **Serverless** → регион ближайший (EU West)
3. Создай пользователя и БД `hozmir`
4. Скопируй Connection String — выбери **Python** формат:
   ```
   postgresql://user:pass@cluster.cockroachlabs.cloud:26257/hozmir?sslmode=verify-full
   ```
5. Для asyncpg добавь `+asyncpg` после `postgresql`:
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@...cockroachlabs.cloud:26257/hozmir?sslmode=verify-full
   DATABASE_SYNC_URL=postgresql+psycopg://user:pass@...cockroachlabs.cloud:26257/hozmir?sslmode=verify-full
   ```

---

## ШАГ 2 — Backblaze B2

1. Зайди на https://backblaze.com → Sign In
2. **B2 Cloud Storage** → Create a Bucket
   - Bucket name: `hozmir-photos`
   - Files: **Public** (чтобы фото открывались по URL)
3. **App Keys** → Add a New Application Key
   - Name: `hozmir-prod`
   - Bucket: `hozmir-photos`
   - Access: Read and Write
4. Сохрани `keyID` и `applicationKey`

---

## ШАГ 3 — Railway (бэкенд + Redis)

### 3.1 Создай новый проект

1. Зайди на https://railway.app → Dashboard
2. **New Project** → **Deploy from GitHub repo**
3. Выбери репозиторий `Rufat010694/hoz-mir`
4. **Root Directory** → укажи `backend`
5. Railway подхватит `nixpacks.toml` автоматически

### 3.2 Добавь Redis

В том же проекте:
1. **+ New** → **Database** → **Add Redis**
2. После создания Railway автоматически добавит переменную `REDIS_URL` в сервис

### 3.3 Переменные окружения бэкенда

Railway → твой сервис → **Variables** → добавь:

```
DATABASE_URL=postgresql+asyncpg://...cockroachlabs.cloud:26257/hozmir?sslmode=verify-full
DATABASE_SYNC_URL=postgresql+psycopg://...cockroachlabs.cloud:26257/hozmir?sslmode=verify-full
SECRET_KEY=<сгенерируй: python3 -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
B2_KEY_ID=<твой keyID>
B2_APP_KEY=<твой applicationKey>
B2_BUCKET_NAME=hozmir-photos
B2_ENDPOINT_URL=https://s3.us-west-004.backblazeb2.com
CORS_ORIGINS=["https://твой-домен.vercel.app"]
DEBUG=False
```

> `REDIS_URL` Railway добавит сам при создании Redis сервиса.

### 3.4 Домен бэкенда

Railway → Settings → **Networking** → **Generate Domain**
Скопируй URL вида `https://hoz-mir-backend.railway.app`

---

## ШАГ 4 — Vercel (фронтенд)

1. Зайди на https://vercel.com → New Project
2. Import репозиторий `Rufat010694/hoz-mir`
3. **Root Directory** → `frontend`
4. Framework Preset: **Vite**
5. **Environment Variables** → добавь:
   ```
   VITE_API_URL=https://hoz-mir-backend.railway.app
   ```
6. Deploy → скопируй URL вида `https://hoz-mir.vercel.app`

### 4.1 Обновить CORS на Railway

Вернись в Railway → Variables → обнови:
```
CORS_ORIGINS=["https://hoz-mir.vercel.app"]
```

---

## ШАГ 5 — Создать admin пользователя

После деплоя бэкенда открой Railway → твой сервис → **Shell**:

```bash
python3 -c "
import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import hash_password
import secrets

async def create_admin():
    async with AsyncSessionLocal() as db:
        u = User(
            username='admin',
            hashed_password=hash_password('ЗАМЕНИ_ПАРОЛЬ'),
            store_name='Хоз Мир',
            catalog_slug='hozmir-' + secrets.token_hex(3),
            is_active=True,
        )
        db.add(u)
        await db.commit()
        print('Admin created, slug:', u.catalog_slug)

asyncio.run(create_admin())
"
```

---

## ШАГ 6 — Авто-бэкап (Cron Job)

Railway → проект → **+ New** → **Empty Service**
- Name: `backup`
- Root Directory: `backend`
- Start Command: `python3 scripts/backup.py`
- **Settings** → **Cron Schedule**: `0 3 * * *` (каждый день в 03:00 UTC)
- Те же переменные что у основного сервиса

---

## Проверка

- Бэкенд: `https://hoz-mir-backend.railway.app/api/health` → `{"status":"ok"}`
- Swagger: `https://hoz-mir-backend.railway.app/api/docs`
- Фронтенд: `https://hoz-mir.vercel.app`
