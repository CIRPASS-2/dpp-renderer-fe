#################
# Build the app #
#################
FROM docker.io/node:22.15.0-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm install -g @angular/cli
RUN ng build --output-path=/dist


################
# Run in NGINX #
################
FROM docker.io/nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

RUN chgrp -R 0 /etc/nginx/ && chmod -R g=u /etc/nginx/ && \
    chgrp -R 0 /usr/share/nginx/html && chmod -R g=u /usr/share/nginx/html && \
    chgrp -R 0 /var/cache/nginx/ && chmod -R g=u /var/cache/nginx && \
    find /var/run -type d -not -path "/var/run/secrets*" -exec chgrp 0 {} \; && \
    find /var/run -type d -not -path "/var/run/secrets*" -exec chmod g=u {} \;

COPY ./deploy/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /dist/browser /usr/share/nginx/html

RUN chgrp -R 0 /usr/share/nginx/html/assets/ && chmod -R g=u /usr/share/nginx/html/assets/

EXPOSE 8080

#USER 1001
# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh", "-c", "\
  envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js; \
  cat /usr/share/nginx/html/assets/env.js; \
  exec nginx -g 'daemon off;'"]
