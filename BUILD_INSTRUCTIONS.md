# Build Instructions

## Frontend Build

To build the frontend with proper environment variables:

```bash
# Build with default API URL (localhost:8000)
docker build -t frontend ./frontend

# Build with custom API URL
docker build --build-arg REACT_APP_API_BASE_URL=http://your-backend-url:8000 -t frontend ./frontend

# Run the frontend container
docker run -p 3000:80 -e REACT_APP_API_BASE_URL=http://your-backend-url:8000 frontend
```

## Backend Build

```bash
# Build the backend
docker build -t backend ./backend

# Run the backend container
docker run -p 8000:8000 backend
```

## Environment Variables

The frontend will automatically use the environment variable `REACT_APP_API_BASE_URL` to connect to the backend. If not provided, it defaults to `http://localhost:8000`.

## API Configuration

The frontend is configured to:
- Use `window._env_.REACT_APP_API_BASE_URL` if available (injected at runtime)
- Fall back to `process.env.REACT_APP_API_BASE_URL` 
- Default to `http://localhost:8000` if neither is available

## Troubleshooting

1. **Connection Issues**: Make sure the backend is running and accessible at the URL specified in `REACT_APP_API_BASE_URL`
2. **CORS Issues**: Ensure the backend has `CORS_ALLOW_ALL_ORIGINS = True` in settings
3. **Environment Variables**: Check that the environment variables are properly set in the container
