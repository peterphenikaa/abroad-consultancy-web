# --- Local Dev MAKEFILE ---

NETWORK_NAME := app-network

.PHONY: help network auth app up down logs clean

help: 
	@echo "Available commands:"
	@echo "  make up      - Start the entire system (Network, Auth, App...)"
	@echo "  make down    - Stop and remove all containers"
	@echo "  make network - Create the shared network if it doesn't exist"
	@echo "  make logs    - View real-time logs of all containers"
	@echo "  make clean   - Stop system and remove unused networks/volumes"

# 1. Init network (using it only when the net is not exists)
network:
	@echo "- Checking network: $(NETWORK_NAME)..."
	@docker network ls | grep -q $(NETWORK_NAME) || (echo "- Creating network: $(NETWORK_NAME)" && docker network create $(NETWORK_NAME))

# 2. Start sub service
auth: network 
	@echo "- Starting auth service..."
	@cd services/auth-service && docker compose up -d

kong: network
	@echo "- Starting kong-api_gateway service..."
	@cd services/kong && docker compose up -d


app: network
	@echo "- Starting app ..."
	@docker compose up -d

# 3. system 

up: app kong auth
	@echo "- [SUCCESS] All services are up and running!"

down: 
	@echo "- Stopping all Services.."
	@cd services/auth-service && docker compose down
	@docker compose down
	@echo "- Stopped all Services!"

logs:
	@echo "- Tailing logs for Auth Service and Kong Gateway..."
	@docker logs -f cambridge_auth_service cambridge_kong_gateway

clean: down
	@echo "- Cleaning up system (rm unused networks/volumes)..."
	@docker system prune -f
	@echo "- [SUCCESS] System cleaned up!"
