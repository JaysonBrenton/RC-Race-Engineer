# filepath: Makefile
# Why: One-liner tasks for your Context Lab workflow using the project venv + .env

SHELL := /bin/bash
.ONESHELL:
.DEFAULT_GOAL := help

PROJECT_ROOT := /home/jayson/Development/RCRaceEngineer/context-lab
VENV := $(PROJECT_ROOT)/.venv
PY := $(VENV)/bin/python

# Pass question via env: `make show QUESTION="..."` or `make ask QUESTION="..."`
QUESTION ?= This is the RCRaceEngineer project

# Why: Load secrets (OPENAI_API_KEY) if present
define LOAD_ENV
if [ -f "$(PROJECT_ROOT)/.env" ]; then
  set -o allexport
  source "$(PROJECT_ROOT)/.env"
  set +o allexport
fi
endef

# Why: Guard if venv is missing or not built yet
define REQUIRE_VENV
[ -x "$(PY)" ] || { \
  echo "ERROR: venv missing. Run inside $(PROJECT_ROOT):"; \
  echo "  python3 -m venv .venv && source .venv/bin/activate && pip install -e ."; \
  exit 1; \
}
endef

.PHONY: help ingest show ask

help:
	@echo "Targets:"
	@echo "  make ingest              # Ingest data/raw using OpenAI embeddings"
	@echo "  make show QUESTION='...' # Build+print assembled context (no chat)"
	@echo "  make ask  QUESTION='...' # Ask with context via chat model (shows context too)"

ingest:
	@echo ">> Ingesting documents from data/raw using OpenAI embeddings..."
	cd "$(PROJECT_ROOT)"
	$(REQUIRE_VENV)
	$(LOAD_ENV)
	source "$(VENV)/bin/activate"
	$(PY) -m contextlab.cli ingest data/raw

show:
	@echo ">> Building and printing assembled context (no model call)..."
	cd "$(PROJECT_ROOT)"
	$(REQUIRE_VENV)
	$(LOAD_ENV)
	source "$(VENV)/bin/activate"
	$(PY) -m contextlab.cli show-context "$(QUESTION)"

ask:
	@echo ">> Asking chat model with assembled context (model from ctx.yaml)..."
	cd "$(PROJECT_ROOT)"
	$(REQUIRE_VENV)
	$(LOAD_ENV)
	source "$(VENV)/bin/activate"
	$(PY) -m contextlab.cli ask "$(QUESTION)" --show-context

