SHELL := /bin/bash

export JWT_SECRET ?= change-me
export PWD_SALT ?= sv

.PHONY: up down logs rebuild psql seed smoke

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

rebuild:
	docker compose build --no-cache

psql:
	docker compose exec db psql -U sv -d svdb

seed:
	# Re-run SQL files inside DB container (useful if volume already exists)
	docker compose exec -T db psql -U sv -d svdb -f /docker-entrypoint-initdb.d/001_infracciones.sql
	docker compose exec -T db psql -U sv -d svdb -f /docker-entrypoint-initdb.d/bootstrap.sql

smoke:
	# Run smoke tests from host against containerized API
	cd backend && BASE_URL=http://localhost:3000/api node --version >/dev/null && npx tsx tests/smoke.ts
