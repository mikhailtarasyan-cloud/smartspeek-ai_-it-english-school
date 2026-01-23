FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic
COPY app /app/app
COPY main.py /app/main.py

EXPOSE 8000

CMD ["bash", "-lc", "alembic upgrade head && python -m app.seed && uvicorn main:app --host 0.0.0.0 --port 8000"]
