# GitHub Actions Workflows

## Test AIHTML Applications (`test-all.yml`)

This workflow runs comprehensive tests for all parts of the application:

- **SlideCraft FastAPI** - SlideCraft HTML generation tests and app startup smoke test
- **Main Next.js** - Lint and production build
- **Docker Build** - Verifies Docker image builds successfully

## Testing Locally

Before pushing, you can test everything locally using the provided script:

```bash
./test-local.sh
```

This script runs the same tests that GitHub Actions will run, so you can catch issues early.

## Manual Testing

If you prefer to test individual components:

### SlideCraft FastAPI Tests
```bash
# Main FastAPI
cd servers/fastapi
export APP_DATA_DIRECTORY=/tmp/app_data
export TEMP_DIRECTORY=/tmp/aihtml
export DATABASE_URL=sqlite+aiosqlite:///./test.db
export DISABLE_ANONYMOUS_TRACKING=true
export DISABLE_IMAGE_GENERATION=true
export PYTHONPATH=$(pwd)
pytest tests/unit/test_slidecraft.py -q

# FastAPI startup and route smoke test
python -c "from api.main import app; assert any(route.path == '/api/v1/ppt/slidecraft/generate' for route in app.routes)"
```

### Next.js Tests
```bash
# Main Next.js
cd servers/nextjs
npm run lint
npm run build
```

### Docker Build
```bash
docker build -t aihtml:test -f Dockerfile .
docker images | grep aihtml:test
```
