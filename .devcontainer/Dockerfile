FROM mcr.microsoft.com/devcontainers/javascript-node:4-24-bookworm

# Layer 1: apt prerequisites
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg \
    software-properties-common \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Layer 2: Terraform 1.14.6 via HashiCorp apt repo
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends terraform=1.14.6-1 \
    && rm -rf /var/lib/apt/lists/*

# Layer 3: AWS CLI v2 — multi-arch (AMD64 / ARM64)
RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then AWS_ARCH="x86_64"; \
       elif [ "$ARCH" = "aarch64" ]; then AWS_ARCH="aarch64"; \
       else echo "Unsupported architecture: $ARCH" && exit 1; fi \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${AWS_ARCH}.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws

# Layer 4: just 1.46.0 — prebuilt musl binary (distro-independent, multi-arch)
RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then JUST_ARCH="x86_64-unknown-linux-musl"; \
       elif [ "$ARCH" = "aarch64" ]; then JUST_ARCH="aarch64-unknown-linux-musl"; \
       else echo "Unsupported architecture: $ARCH" && exit 1; fi \
    && curl -fsSL "https://github.com/casey/just/releases/download/1.46.0/just-1.46.0-${JUST_ARCH}.tar.gz" \
    -o /tmp/just.tar.gz \
    && tar -xzf /tmp/just.tar.gz -C /tmp \
    && mv /tmp/just /usr/local/bin/just \
    && chmod +x /usr/local/bin/just \
    && rm /tmp/just.tar.gz

# Layer 5: Chromium + dependencies for headless Lighthouse / accessibility audits
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnspr4 \
    libnss3 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*