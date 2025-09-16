#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# File: capture-fw-selinux.sh
# Author: Jayson + The Brainy One
# Date: 2025-09-17
# Purpose: Capture firewall, SELinux, ports, and related diagnostics for the
#          RCRaceEngineer build log. Idempotent, safe to rerun.
# -----------------------------------------------------------------------------
set -euo pipefail
HOST_LABEL="${HOST_LABEL:-$(hostname -s)}"
NOW="$(date +'%Y%m%d-%H%M%S')"
OUT_DIR="/home/jayson/Development/RCRaceEngineer/_evidence/${NOW}-${HOST_LABEL}"
OUT_FILE="${OUT_DIR}/firewall-selinux-${HOST_LABEL}.txt"
mkdir -p "${OUT_DIR}"
exec > >(tee -a "${OUT_FILE}") 2>&1
echo "===== CAPTURE START: ${NOW} @ ${HOST_LABEL} ====="
echo "# uname -a"; uname -a; echo
echo "===== PACKAGES ====="; rpm -q firewalld || true; rpm -q policycoreutils policycoreutils-python-utils || true; rpm -q setools-console setroubleshoot-server || true; echo
echo "===== FIREWALLD: SERVICE STATE ====="; systemctl is-enabled firewalld || true; systemctl is-active firewalld || true; systemctl status firewalld --no-pager --full || true; echo
echo "===== FIREWALLD: CONFIG ====="; firewall-cmd --state || true; firewall-cmd --get-active-zones || true; firewall-cmd --zone=public --list-all || true; firewall-cmd --list-all || true; firewall-cmd --list-ports || true; firewall-cmd --list-services || true; firewall-cmd --list-rich-rules || true; echo
echo "===== FIREWALLD (PERMANENT): ALL ZONES ====="; firewall-cmd --permanent --get-zones || true; firewall-cmd --permanent --get-active-zones || true; firewall-cmd --permanent --list-all-zones || true; echo
echo "===== NFT / IPTABLES BACKENDS ====="; nft list ruleset || true; iptables -S || true; ip6tables -S || true; echo
echo "===== SELINUX: STATUS ====="; getenforce || true; sestatus || true; echo
echo "===== SELINUX: BOOLEANS OF INTEREST ====="; getsebool -a | grep -E 'httpd_can_network_connect(_db)?|nis_enabled' || true; echo
echo "===== SELINUX: PORT TYPES ====="; if command -v semanage >/dev/null 2>&1; then semanage port -l | egrep -i 'http_port_t|node_t|postgresql_port_t|ephemeral_port_t' || true; else echo "semanage not installed"; fi; echo
echo "===== SELINUX: RECENT AVC DENIALS ====="; if command -v ausearch >/dev/null 2>&1; then ausearch -m AVC,USER_AVC -ts yesterday || true; else echo "ausearch not installed"; fi; echo
echo "===== OPEN PORTS (expected: 3000, 1337, 5432) ====="; ss -tulpn | egrep ':(3000|1337|5432)\\b' || true; echo
echo "===== PROCESSES (node/strapi/postgres) ====="; ps -eo pid,ppid,user,cmd | egrep -i 'node|strapi|postgres' | egrep -v 'egrep' || true; echo
echo "===== QUICK HTTP PROBES ====="; curl -I --max-time 3 http://127.0.0.1:3000/ || true; curl -I --max-time 3 http://127.0.0.1:1337/ || true; echo
echo "===== JOURNAL RECENT FIREWALL/SELINUX MESSAGES ====="; journalctl -q -b -n 200 | egrep -i 'firewalld|selinux|avc|denied' || true; echo
echo "===== CAPTURE END: ${NOW} @ ${HOST_LABEL} ====="
echo "Output saved to: ${OUT_FILE}"
