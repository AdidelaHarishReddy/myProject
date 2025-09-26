#!/bin/sh

# Inject environment variables into env.js
cat <<EOF > /usr/share/nginx/html/env.js
window._env_ = {
  REACT_APP_API_BASE_URL: "${REACT_APP_API_BASE_URL}"
};
EOF

exec "$@"
