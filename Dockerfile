# ======================
# Estágio 1: Build da aplicação
# ======================
# Utiliza Node.js 22 para instalar as dependências de desenvolvimento e compilar o código TypeScript.
# Este estágio não será incluído diretamente na imagem final.

FROM node:22-alpine AS build
# Define o diretório de trabalho dentro do container.
WORKDIR /app

# Copia primeiro os ficheiros de dependências para
# aproveitar o cache do Docker quando o código mudar.
COPY package*.json ./

# Instala as dependências exatamente como definidas
# no package-lock.json.
RUN npm ci

# Copia a configuração do TypeScript e o código-fonte.
COPY tsconfig.json ./
COPY src ./src

# Compila e gera o bundle da API em dist/server.js.
RUN npm run build

# ======================
# Estágio 2: Dependências de produção
# ======================
# Instala apenas as dependências necessárias em produção.
# As ferramentas de desenvolvimento, como tsx e esbuild, não são instaladas neste estágio.

FROM node:22-alpine AS production-deps
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ======================
# Estágio 3: Imagem final
# ======================
# Contém o artefacto compilado e as dependências de produção.
# Não inclui o código-fonte TypeScript nem as dependências exclusivas do processo de build.

FROM node:22-alpine AS production
WORKDIR /app

# Define o ambiente de execução como produção.
ENV NODE_ENV=production

# Define a porta utilizada pela API.
ENV PORT=3000

# Copia apenas as dependências de produção.
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules

# Copia o bundle gerado no estágio de build.
COPY --from=build --chown=node:node /app/dist/server.js ./server.js

# Executa a aplicação com um utilizador sem privilégios de root, seguindo o princípio do menor privilégio.
USER node

# Documenta a porta utilizada pela aplicação.
EXPOSE 3000

# Inicia a API utilizando o Node.js.
CMD ["node", "server.js"]