# Auth Service Network Integration Plan

## Goal

Connect the independently managed `auth-service` (with its own `compose.yaml`) to the root `docker-compose.yml` network so that Kong (or any other API gateway) can route traffic to it, while keeping its internal databases (PostgreSQL, Redis) isolated and secure.

## Architecture

We will use a **Dual-Network Strategy**:

1. **`cambridge_net` (Internal)**: Exists only within `auth-service/compose.yaml`. Used for communication between `auth-service`, `postgres`, and `redis`.
2. **`app-network` (Shared/External)**: Exists across the entire project. Defined in the root `docker-compose.yml`. Kong and `auth-service` will both connect to this network.

## Step-by-Step Implementation

### Phase 1: Root Docker Compose Updates

**File:** `/docker-compose.yml`

1. **Explicit Network Naming:**
   Modify the `app-network` definition to have an explicit, predictable external name (`app-network`).

   ```yaml
   networks:
     app-network:
       name: app-network
       driver: bridge
   ```

2. **Remove Conflicting Auth Service:**
   Delete the `auth-service` block from the root `docker-compose.yml` because it is already managed by `services/auth-service/compose.yaml`.

3. **Resolve Redis Conflicts:**
   The root compose has a `redis` container (used for things like gateway rate-limiting), and the auth compose has its own `redis` container. Keeping the same service name will cause internal DNS conflicts, and they both try to bind to host port `6379`.
   - Rename the service from `redis` to `kong-redis`.
   - Explicitly define the container name as `cambridge_kong_redis`.
   - Change the host port mapping to `"6380:6379"`.
   ```yaml
   services:
     kong-redis: # ← Đổi từ 'redis' thành 'kong-redis'
       container_name: cambridge-kong-redis # ← Định danh rõ ràng
       ports:
         - "6380:6379"
   ```

### Phase 2: Auth Service Compose Updates

**File:** `/services/auth-service/compose.yaml` and `/services/auth-service/compose.override.yaml`

1. **Define External Network:**
   Add the shared external network at the bottom of the `compose.yaml` file.

   ```yaml
   networks:
     cambridge_net:
       driver: bridge
     app-network:
       external: true
       name: app-network
   ```

2. **Attach Auth Service to Both Networks:**
   Update the `auth-service` definition in `compose.yaml` to connect to both its internal database network and the shared external network.

   ```yaml
   services:
     auth-service:
       # ... existing config ...
       networks:
         - cambridge_net
         - app-network
   ```

   _(Note: `postgres`, `redis`, `pgadmin`, and `redisinsight` will remain ONLY on `cambridge_net` for security)._

3. **Update Override File (`compose.override.yaml`):**
   In the Dev environment, Docker merges the `compose.override.yaml`. If the override file doesn't explicitly declare the networks with their aliases, the static hostname resolution could break. We must add the alias for Kong to resolve it seamlessly.
   ```yaml
   services:
     auth-service:
       networks:
         cambridge_net: {}
         app-network:
           aliases:
             - cambridge-auth-service # ← Tên miền tĩnh để Kong gọi ngầm
   ```

### Phase 3: Execution & Verification

1. **Create the Shared Network and Start Auth Service:**
   Since Auth service requests the `app-network` network via `external: true`, the network must exist before `docker compose up` is executed, otherwise Docker will throw an error.

   ```bash
   # Khởi tạo mạng thủ công trước
   docker network create app-network

   # Khởi động Auth service
   cd services/auth-service
   docker compose up -d
   ```

2. **Start the Root Infrastructure Stack:**
   This starts the gateway, Kafka, MinIO, etc., attaching them to the same network.

   ```bash
   cd ../../
   docker compose up -d
   ```

3. **Verify Connectivity:**
   Test if containers on the root network can reach the auth service using the port defined in your `.env` file (e.g. `${AUTH_SERVICE_PORT}`).
   ```bash
   docker exec -it <kong-or-api-gateway-container> curl http://cambridge_auth_service:${AUTH_SERVICE_PORT}/health
   ```
   _Expected: HTTP 200 OK from the Auth Service._

### Phase 4: Automated the whole process

Using makefile to automate the network creation and service startup process:

```makefile
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

app: network
	@echo "- Starting app ..."
	@docker compose up -d

# 3. system

up: app auth
	@echo "- [SUCCESS] All services are up and running!"

down:
	@echo "- Stopping all Services.."
	@cd services/auth-service && docker compose down
	@docker compose down
	@echo "- Stopped all Services!"

# Đã fix: Bổ sung lệnh logs bị thiếu
logs:
	@echo "- Tailing logs for Root App and Auth Service..."
	@docker logs -f cambridge_auth_service

clean: down
	@echo "- Cleaning up system (rm unused networks/volumes)..."
	@docker system prune -f
	@echo "- [SUCCESS] System cleaned up!"
```
