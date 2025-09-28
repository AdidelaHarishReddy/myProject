#!/bin/sh

# Set default values if environment variables are not provided
REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-"http://localhost:8000"}

# Inject environment variables into env.js
cat <<EOF > /usr/share/nginx/html/env.js
window._env_ = {
  REACT_APP_API_BASE_URL: "${REACT_APP_API_BASE_URL}"
};
EOF

echo "Environment variables injected:"
echo "REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL}"

exec "$@"
