# check=skip=InvalidDefaultArgInFrom
# build_image.py supplies required runtime versions from mise.toml.
ARG NODE_VERSION
ARG PYTHON_VERSION
FROM node:${NODE_VERSION}-bookworm-slim AS node
FROM python:${PYTHON_VERSION}-slim-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
RUN apt-get update && apt-get install -y --no-install-recommends bash git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git config --system --add safe.directory /app
RUN npm install -g @openai/codex@0.150.1 --fetch-timeout=60000 --fetch-retries=1 --loglevel=http
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION} --fetch-timeout=60000 --fetch-retries=1
COPY .build/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt
COPY .build/package/package.json .build/package/pnpm-lock.yaml /opt/rsp-package/
RUN cd /opt/rsp-package && pnpm install --prod --frozen-lockfile --ignore-scripts
COPY .build/package /opt/rsp-package
RUN ln -s /opt/rsp-package/bin/rsp.mjs /usr/local/bin/rsp && chmod +x /opt/rsp-package/bin/rsp.mjs
COPY support/grade.py support/checks.py support/verifier.py support/workspace.py support/outputs.py /opt/rsp-eval/
ENV PYTHONUNBUFFERED=1
WORKDIR /app
