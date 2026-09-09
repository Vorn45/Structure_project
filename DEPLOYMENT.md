# Digitech WMS GitHub Actions Docker Deployment Handbook
# សៀវភៅណែនាំដំឡើង GitHub Actions និង Docker ដោយស្វ័យប្រវត្តិលើ Synology NAS សម្រាប់ Digitech WMS

> **Document purpose / គោលបំណងឯកសារ**
> 
> This is the complete, step-by-step deployment handbook for `digitech-wms` on Synology NAS. It establishes an automated CI/CD pipeline using a self-hosted GitHub Actions runner in Docker, ensuring zero downtime, safe database preservation, and full coexistence with other projects on the same NAS.
> 
> នេះជាឯកសារណែនាំពេញលេញមួយជំហានម្តងៗ សម្រាប់ការដាក់ឱ្យដំណើរការ (deployment) `digitech-wms` លើ Synology NAS ដោយស្វ័យប្រវត្តិតាម GitHub Actions self-hosted runner ក្នុង Docker។ ធានាសុវត្ថិភាពទិន្នន័យ database និងមិនប៉ះពាល់ project ផ្សេងៗលើ NAS ឡើយ។

---

## 1. System Architecture / រចនាសម្ព័ន្ធប្រព័ន្ធ

```text
Developer (Local Machine)
    │
    │ git push origin dev (Testing / no deploy to NAS)
    ▼
GitHub (dev branch)
    │
    │ Pull Request: dev -> main
    ▼
GitHub (main branch)
    │
    │ GitHub Actions Trigger (.github/workflows/deploy.yml)
    ▼
Self-Hosted Runner Container on Synology NAS (wms-github-runner)
    │
    │ Docker Socket: /var/run/docker.sock
    ▼
Synology NAS Docker Engine (DSM 7.3)
    ├── digitech-wms-load_balancer-1 (Nginx Gateway :4500)
    ├── digitech-wms-web-1           (Angular Frontend - rebuilt if web/** changes)
    ├── digitech-wms-api-1           (NestJS Backend   - rebuilt if api/** changes)
    ├── digitech-wms-postgres-1      (PostgreSQL 16    - volume preserved & protected)
    └── digitech-wms-redis-1         (Redis 7          - volume preserved)
```

---

## 2. Exact Project Values / តម្លៃពិតប្រាកដរបស់ Project

| Purpose / គោលបំណង | Digitech WMS Value / តម្លៃ WMS | Coexistence with OSSP / ភាពដាច់ដោយឡែកពី OSSP |
|---|---|---|
| **GitHub Repository** | `https://github.com/BrusmunyPum/digitech-wms` | Dedicated repo |
| **Development Branch** | `dev` | Normal development |
| **Production Branch** | `main` | Production release |
| **Runner Host Directory** | `/volume1/docker/digitechkh/wms-runner` | Distinct from `/volume1/docker/actions-runner` |
| **Runner Container Name** | `wms-github-runner` | Distinct from `ossp-github-runner` |
| **Runner Labels** | `self-hosted`, `nas-wms` | Avoids job collision with `nas` |
| **Compose Project Name** | `digitechkh-wms` | Isolated network & volumes |
| **Database Volume** | `digitechkh-wms_postgres_data` | Strictly preserved |
| **Redis Volume** | `digitechkh-wms_redis_data` | Strictly preserved |
| **Gateway Host Port** | `4500` | Single entrypoint for NAS |
| **Database External Port** | `5433` | Host port for pgAdmin/direct access |
| **GitHub Environment** | `production_ENV` | Holds environment secret |
| **GitHub Secret Name** | `PRODUCTION_ENV_FILE` | Contains the production `.env` |
| **Docker API Version** | `1.43` | Synology Docker Engine 24.0.2 |

---

## 3. Step-by-Step Setup Guide / ជំហានដំឡើងលម្អិត

### Step 1: Pre-Deployment Database Backup / បង្កើត Backup Database ជាមុន
Run this on your Synology NAS terminal before modifying anything:

```bash
mkdir -p /volume1/docker/digitechkh/wms-runner/backups

# Backup current PostgreSQL database
sudo docker exec $(sudo docker ps -qf "name=postgres" | head -n 1) \
  pg_dump -U Muny -d wfm_db -Fc > /volume1/docker/digitechkh/wms-runner/backups/wfm_db-before-ci-$(date +%Y%m%d-%H%M%S).dump

# Verify backup size
ls -lh /volume1/docker/digitechkh/wms-runner/backups/
```

---

### Step 2: Prepare the NAS Runner Directory / បង្កើត Runner Directory
Run on your Synology NAS terminal:

```bash
cd /volume1/docker/digitechkh
sudo mkdir -p wms-runner
cd wms-runner

# Download official GitHub Actions runner package
sudo curl -o actions-runner-linux-x64-2.336.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.336.0/actions-runner-linux-x64-2.336.0.tar.gz

# Verify SHA256 checksum
echo "04cf0be1aff4c3ec3554466c39124ca250e3effd8873bb7e8d68535aa9505d5d  actions-runner-linux-x64-2.336.0.tar.gz" | sha256sum -c -

# Extract
sudo tar xzf ./actions-runner-linux-x64-2.336.0.tar.gz
```

---

### Step 3: Build the Ubuntu Runner Image (or Reuse Existing)
Because Synology DSM 7.3 lacks native runner dependencies (`ldd`), the runner executes inside an Ubuntu 24.04 container.

If you already built `ossp-actions-runner:2.336.0` on this NAS, you can reuse it! Or build `wms-actions-runner:2.336.0`:

```bash
sudo docker build -t wms-actions-runner:2.336.0 - <<'EOF'
FROM ubuntu:24.04

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       git \
       jq \
       libc-bin \
       libicu74 \
       libssl3t64 \
       zlib1g \
       docker.io \
       docker-compose-v2 \
    && rm -rf /var/lib/apt/lists/*

ENV RUNNER_ALLOW_RUNASROOT=1
WORKDIR /volume1/docker/digitechkh/wms-runner
ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["if [ ! -f .runner ]; then ./config.sh --unattended --url \"$RUNNER_URL\" --token \"$RUNNER_TOKEN\" --name \"wms-synology-nas\" --labels \"nas-wms\" --work \"_work\" --replace; fi; exec ./run.sh"]
EOF
```

---

### Step 4: Register the Runner with GitHub / ចុះឈ្មោះ Runner ទៅ GitHub

1. In your browser, open GitHub:  
   👉 `https://github.com/BrusmunyPum/digitech-wms/settings/actions/runners/new`
2. Look at the token in the command provided by GitHub (e.g. `AQ...`).
3. On your Synology NAS terminal, safely store the token in memory (it won't show on screen):

```bash
read -s RUNNER_TOKEN
```
*(Paste the token and press Enter)*

4. Launch the runner registration container:

```bash
sudo docker run -d \
  --name wms-github-runner \
  --restart unless-stopped \
  -e RUNNER_URL="https://github.com/BrusmunyPum/digitech-wms" \
  -e RUNNER_TOKEN="$RUNNER_TOKEN" \
  -v /volume1/docker/digitechkh/wms-runner:/volume1/docker/digitechkh/wms-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wms-actions-runner:2.336.0

unset RUNNER_TOKEN
```

5. Check logs to confirm registration:

```bash
sudo docker logs -f wms-github-runner
```
You should see:
```text
Connected to GitHub
Runner successfully added
Settings Saved
Listening for Jobs
```
*(Press `Ctrl+C` to exit the log view)*

---

### Step 5: Clean Up Token & Set Synology Docker API Override
The runner configuration is now saved permanently in `/volume1/docker/digitechkh/wms-runner/.runner`.  
Recreate the container to remove the token from container metadata and lock `DOCKER_API_VERSION=1.43` (Synology DSM Docker version):

```bash
sudo docker rm -f wms-github-runner

sudo docker run -d \
  --name wms-github-runner \
  --restart unless-stopped \
  -e RUNNER_URL="https://github.com/BrusmunyPum/digitech-wms" \
  -e DOCKER_API_VERSION="1.43" \
  -v /volume1/docker/digitechkh/wms-runner:/volume1/docker/digitechkh/wms-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wms-actions-runner:2.336.0
```

Verify that the runner inside the container can talk to the NAS Docker daemon:

```bash
sudo docker exec wms-github-runner docker version --format 'Server: {{.Server.Version}} (API: {{.Server.APIVersion}})'
sudo docker exec wms-github-runner docker compose version
```

---

### Step 6: Configure GitHub Secrets / កំណត់ GitHub Secrets

1. Open your repository on GitHub:  
   👉 `https://github.com/BrusmunyPum/digitech-wms/settings/environments`
2. Open the **`production_ENV`** environment.
3. Under **Environment secrets**, click **Add secret**:
   - **Name**: `PRODUCTION_ENV_FILE`
   - **Value**: Paste the exact contents of your production `.env` file from the NAS.
4. *(Optional)* If you want Telegram notifications:
   - Go to **Settings → Secrets and variables → Actions**
   - Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

---

## 4. How the Auto-Deployment Works / របៀបដែលការ Deploy ដំណើរការ

### The Branch Workflow:
- **`dev`**: Daily commits and testing. Pushing to `dev` runs CI verification on GitHub cloud runners, but **does not touch your NAS**.
- **`main`**: Production branch.
- **Releasing**: Open a Pull Request from `dev` &rarr; `main` and merge it.
- The push to `main` immediately triggers `.github/workflows/deploy.yml` on your NAS runner.

### Smart Container Rebuilding:
- If only `api/**` changed &rarr; Rebuilds **only API** (`api`).
- If only `web/**` changed &rarr; Rebuilds **only Web** (`web`).
- If both or `nginx/**` / `docker-compose.yml` changed &rarr; Rebuilds both and reloads gateway.
- If only documentation changed &rarr; Skips rebuild completely.

### Persistent Volume Safety:
The workflow executes:
```bash
docker volume inspect "digitech-wms_postgres_data"
```
If the volume is missing, the workflow halts immediately **before** any build or restart. It **never** prunes volumes or removes database data.

---

## 5. Routine Operations / ប្រតិបត្តិការប្រចាំថ្ងៃ

### Check Runner Status
```bash
sudo docker ps --filter name=wms-github-runner
sudo docker logs --tail 50 wms-github-runner
```

### Check Project Containers
```bash
sudo docker ps --filter label=com.docker.compose.project=digitech-wms --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View Live Logs
```bash
sudo docker logs -f digitech-wms-api-1
sudo docker logs -f digitech-wms-web-1
sudo docker logs -f digitech-wms-load_balancer-1
```

### Manual Trigger
You can trigger a rebuild manually at any time without a Git commit:
1. Go to GitHub &rarr; **Actions** &rarr; **Deploy main to NAS**.
2. Click **Run workflow**.
3. Choose `both`, `api`, or `web`.

---

## 6. Troubleshooting / ដោះស្រាយបញ្ហា

| Issue / បញ្ហា | Cause / មូលហេតុ | Solution / ដំណោះស្រាយ |
|---|---|---|
| `runner stays Offline` | Runner container stopped or no internet | Check `sudo docker ps -a` and `sudo docker logs wms-github-runner`. |
| `client version 1.52 is too new` | Docker API mismatch with DSM | Add `-e DOCKER_API_VERSION="1.43"` to runner container. |
| `A session for this runner already exists` | Previous container was restarted quickly | Wait 2–3 minutes; GitHub will automatically clear the dead session. |
| `PRODUCTION_ENV_FILE is missing` | Secret not set under `production` | Add secret in GitHub Repo &rarr; Settings &rarr; Environments &rarr; `production`. |
| `Volume inspect failed` | Compose project name mismatch | Verify `COMPOSE_PROJECT_NAME=digitech-wms` matches `sudo docker volume ls`. |
| `Job queued waiting for runner` | Runner labels don't match | Ensure runner has labels `self-hosted` and `nas-wms`. |
