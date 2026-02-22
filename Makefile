.PHONY: up down logs deploy clean e2e test test-contracts test-backend

up:
	docker compose up -d --build

down:
	docker compose down -v

logs:
	docker compose logs -f

deploy:
	docker compose up deployer --build --force-recreate

e2e:
	docker compose --profile e2e up --build --exit-code-from e2e e2e

clean:
	docker compose --profile e2e down -v --rmi local

test-contracts:
	cd smart-contract && forge test

test-backend:
	@if [ -f backend/package.json ] && node -e "process.exit(require('./backend/package.json').scripts.test ? 0 : 1)" 2>/dev/null; then \
		cd backend && npm run test; \
	else \
		echo "backend: no test script configured (skipping)"; \
	fi

test: test-contracts test-backend
