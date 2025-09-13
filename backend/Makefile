# LedgerLink Backend Makefile
# Provides convenient shortcuts for common development tasks

.PHONY: help setup setup-docker setup-dev setup-db clean build start dev test lint docker-up docker-down docker-logs

# Default target
help: ## Show this help message
	@echo "LedgerLink Backend - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Setup commands
setup: ## Initial project setup
	npm run setup

setup-docker: ## Setup with Docker (recommended)
	npm run setup:docker

setup-dev: ## Full development setup
	npm run setup:dev

setup-db: ## Database setup and migrations
	npm run setup:db

setup-test: ## Test environment setup
	npm run setup:test

# Development commands
dev: ## Start development server
	npm run dev

start: ## Start production server
	npm start

build: ## Build TypeScript to JavaScript
	npm run build

clean: ## Clean build artifacts and dependencies
	npm run clean

# Database commands
db-generate: ## Generate Prisma client
	npm run db:generate

db-migrate: ## Run database migrations
	npm run migrate

db-reset: ## Reset database and run migrations
	npm run db:reset

db-seed: ## Seed database with sample data
	npm run db:seed

db-studio: ## Open Prisma Studio
	npm run db:studio

# Testing commands
test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage
	npm run test:coverage

# Code quality
lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues
	npm run lint:fix

typecheck: ## Run TypeScript type checking
	npm run typecheck

# Docker commands
docker-build: ## Build Docker image
	docker build -t ledgerlink-backend .

docker-run: ## Run Docker container
	docker run -p 3001:3001 ledgerlink-backend

docker-up: ## Start all Docker services
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f backend

docker-restart: ## Restart Docker services
	docker-compose restart

docker-clean: ## Clean Docker containers and images
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Utility commands
install: ## Install dependencies
	npm install

update: ## Update dependencies
	npm update

audit: ## Run security audit
	npm audit

audit-fix: ## Fix security vulnerabilities
	npm audit fix

# Production commands
prod-build: ## Build for production
	NODE_ENV=production npm run build

prod-start: ## Start production server
	NODE_ENV=production npm start

# Environment commands
env-example: ## Copy environment example file
	cp .env.example .env

env-check: ## Check environment configuration
	@echo "Checking environment configuration..."
	@if [ -f ".env" ]; then \
		echo "✅ .env file exists"; \
		if grep -q "DATABASE_URL" .env; then echo "✅ DATABASE_URL configured"; else echo "❌ DATABASE_URL missing"; fi; \
		if grep -q "REDIS_URL" .env; then echo "✅ REDIS_URL configured"; else echo "❌ REDIS_URL missing"; fi; \
		if grep -q "JWT_SECRET" .env; then echo "✅ JWT_SECRET configured"; else echo "❌ JWT_SECRET missing"; fi; \
	else \
		echo "❌ .env file not found. Run 'make env-example' first."; \
	fi

# Health checks
health: ## Check API health
	@echo "Checking API health..."
	@curl -s http://localhost:3001/api/health | grep -q "healthy" && echo "✅ API is healthy" || echo "❌ API is not responding"

health-detailed: ## Check detailed API health
	@curl -s http://localhost:3001/api/health/detailed | jq .

# Quick shortcuts
up: docker-up ## Shortcut for docker-up
down: docker-down ## Shortcut for docker-down
logs: docker-logs ## Shortcut for docker-logs
restart: docker-restart ## Shortcut for docker-restart

# Development workflow
workflow: setup-dev ## Complete development workflow setup
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo "📍 API: http://localhost:3001"
	@echo "📊 Health: http://localhost:3001/api/health"
	@echo "📖 Docs: http://localhost:3001/api/docs"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev     - Start development server"
	@echo "  make test    - Run tests"
	@echo "  make db-studio - Open database studio"

# One-command setup for new developers
quick-start: ## Quick start for new developers
	@echo "🚀 LedgerLink Quick Start"
	@echo "========================"
	make setup-docker
	@echo ""
	@echo "🎉 Setup complete! Your API is running at http://localhost:3001"

# Show project status
status: ## Show project status
	@echo "📊 LedgerLink Backend Status"
	@echo "============================="
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Git branch: $$(git branch --show-current 2>/dev/null || echo 'Unknown')"
	@echo "Last commit: $$(git log -1 --pretty=format:'%h - %s (%cr)' 2>/dev/null || echo 'Unknown')"
	@echo ""
	@make env-check
	@echo ""
	@make health 2>/dev/null || echo "❌ API is not running"