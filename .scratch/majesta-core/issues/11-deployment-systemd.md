# 11: Deployment — systemd unit + container-friendly packaging

**What to build:** Boring 24/7 hosting: a systemd unit (`Restart=always`) running the gateway, config strictly via env so an optional Dockerfile/Compose file works too, and deploy docs (git pull → restart). Verified by deploying on the real VPS.

**Blocked by:** 04, 05.

**Status:** ready-for-agent

- [ ] Unit file installs and supervises the gateway; crash restarts automatically
- [ ] Process runs with env-only config; container path demonstrated
- [ ] Deploy doc: fresh VPS to running gateway in copy-paste steps
