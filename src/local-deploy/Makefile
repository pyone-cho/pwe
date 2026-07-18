.PHONY: up down restart logs logs-caddy build seed migrate reset shell status clean help

COMPOSE = docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

build: ## Build and start all services
	$(COMPOSE) up -d --build

logs: ## Follow all logs
	$(COMPOSE) logs -f

logs-backend: ## Follow backend logs
	$(COMPOSE) logs -f backend

logs-frontend: ## Follow frontend logs
	$(COMPOSE) logs -f frontend

logs-caddy: ## Follow caddy logs
	$(COMPOSE) logs -f caddy

migrate: ## Run database migrations
	$(COMPOSE) exec backend npx prisma migrate deploy

migrate-dev: ## Create and apply a new migration
	$(COMPOSE) exec backend npx prisma migrate dev

seed: ## Seed the database
	$(COMPOSE) exec backend npx prisma db seed

studio: ## Open Prisma Studio
	$(COMPOSE) exec backend npx prisma studio

reset: ## Reset database, re-migrate, and seed
	$(COMPOSE) down -v
	$(COMPOSE) up -d db
	@sleep 3
	$(COMPOSE) up -d backend
	@sleep 5
	$(COMPOSE) exec backend npx prisma migrate deploy
	$(COMPOSE) exec backend npx prisma db seed
	$(COMPOSE) up -d

shell-backend: ## Open shell in backend container
	$(COMPOSE) exec backend sh

shell-db: ## Open psql in database container
	$(COMPOSE) exec db psql -U pwe_dev -d pwe_dev

status: ## Show container status
	$(COMPOSE) ps

clean: ## Remove containers, volumes, and images
	$(COMPOSE) down -v --rmi local
