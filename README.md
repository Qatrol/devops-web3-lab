# 🚀 Qatrol DevOps & Web3 Lab

Этот репозиторий содержит полноценную локальную инфраструктуру для тестирования DevOps-практик и Web3-разработки.

## 🛠️ Стек технологий
* **Инфраструктура:** Docker, Docker Compose, Nginx (Reverse Proxy)
* **Мониторинг:** Prometheus, Grafana, cAdvisor, Node Exporter, Dozzle
* **Управление:** Arcane (Web UI для Docker), Glance (Дашборд)
* **DevOps:** Gitea (Local Git), Code-Server (VS Code в браузере)
* **Web3:** Foundry (Anvil), Bun, Elysia, Next.js 15, Wagmi, RainbowKit

## 🚀 Запуск
1. Клонируйте репозиторий.
2. Скопируйте `.env.example` в `.env` и заполните секреты.
3. Запустите `docker compose up -d`.
4. Для крипто-приложения: `cd my-crypto-app/docker && docker compose up -d`.
CI/CD работает!
