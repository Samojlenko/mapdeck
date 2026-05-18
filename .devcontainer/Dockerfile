# ========== STAGE 1: Base ==========
FROM node:25.2-trixie-slim AS base
WORKDIR /app


# ========== STAGE 2: Development ==========
FROM base AS development

ARG MAPDECK_USER_UID=1000
ARG MAPDECK_USER_GID=1000

RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN if ! getent passwd ${MAPDECK_USER_UID} > /dev/null; then \
        groupadd -g ${MAPDECK_USER_GID} hostuser && \
        useradd -l -m -u ${MAPDECK_USER_UID} -g hostuser hostuser; \
    fi

USER ${MAPDECK_USER_UID}:${MAPDECK_USER_GID}

EXPOSE 3000 24678
