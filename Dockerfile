FROM node:8-alpine

EXPOSE 6000

VOLUME [ "/app/ssl" ]

WORKDIR /app
COPY package.json tsconfig.json webpack.config.js ./
COPY src/ src/
COPY html/ html/
RUN yarn install && \
    yarn tsc && \
    yarn webpack

CMD ["node", "--require", "dotenv/config", "src/server/FrontEndServer.js"]
