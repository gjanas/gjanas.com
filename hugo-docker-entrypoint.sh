#!/bin/sh
# Uruchamiany automatycznie przez /entrypoint.sh obrazu ghcr.io/gohugoio/hugo.
# Repo jest montowane z hosta (inny UID niż proces w kontenerze), więc git
# odrzuca je jako "dubious ownership" i enableGitInfo nie działa.
# safe.directory git akceptuje tylko z configu globalnego, a Hugo przekazuje
# do gita tylko wybrane zmienne (security.exec.osEnv) — HOME tak,
# GIT_CONFIG_GLOBAL nie. Stąd zapisywalny HOME w /tmp (działa też z `docker run -u`).
export HOME=/tmp/hugo-home
mkdir -p "$HOME"
git config --global --add safe.directory /project
exec hugo "$@"
