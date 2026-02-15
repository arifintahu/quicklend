.PHONY: up down logs deploy clean e2e

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
