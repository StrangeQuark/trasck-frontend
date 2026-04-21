# TRASCK-FRONTEND
**TRASCK-FRONTEND** is an open source UI for the TRASCK project. It works in conjunction with the [TRASCK backend](https://github.com/StrangeQuark/trasck) to serve the website hosted at [https://trasck.com](https://trasck.com)
<br><br><br>

## Technology Stack
- Javascript
- Vite
- React
- NPM
- Docker & Docker Compose
<br><br><br>

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
<br><br>

### Running the Application
Clone the repository and start the service using Docker Compose:

```
git clone https://github.com/StrangeQuark/trasck-frontend.git
cd trasck-frontend
docker-compose up --build
```
<br>

For local Vite development:

```
npm install
npm run dev
```

The dev server runs on `http://localhost:8080`. The backend defaults to `http://localhost:6100`; override it with `VITE_TRASCK_API_BASE_URL` or the existing `VITE_API_URL`.
<br>

### Implemented Console Surfaces
The current route-based console includes setup/auth, work items, planning, programs/portfolio, configuration, automation, imports, dashboards, filters, agents, token administration, system administration, Workspace Settings for security policy plus member/invitation management with role pickers, Project Settings for project security/public-read policy, and an anonymous public project/work-item preview route.
<br>

### Container Security Headers
The production nginx image uses `nginx.conf.template` and runtime environment variables for CSP-related directives:

- `NGINX_SERVER_NAME`
- `TRASCK_CSP_CONNECT_SRC`
- `TRASCK_CSP_IMG_SRC`
- `TRASCK_CSP_STYLE_SRC`
- `TRASCK_CSP_SCRIPT_SRC`

The defaults are local-development values. Set deployed browser/API origins explicitly before using the image outside local testing.
<br>

### API Client Generation
The frontend keeps a generated TypeScript API client under `src/api/generated`. Start the Trasck backend, then regenerate the client when the backend OpenAPI contract changes:

```
npm run generate:api
```

By default the generator reads `http://localhost:6100/v3/api-docs`. Override it with `TRASCK_OPENAPI_URL` for another running backend, or `TRASCK_OPENAPI_SOURCE` to generate from a local OpenAPI JSON file.
<br>

### Source Structure
The Vite app keeps routing and app wiring separate from feature pages:

- `src/App.jsx` contains the top-level router and app wiring.
- `src/app` contains app-level shell components.
- `src/constants` contains shared constants used across routes.
- `src/pages` contains route-level feature pages, with subfolders for larger feature areas such as planning, configuration, automation, and imports.
- `src/components` contains shared UI primitives used across pages, with one component per file.
- `src/hooks` contains reusable React hooks.
- `src/utils` contains shared parsing/form helpers.
- `src/styles` contains app-level styles that are not owned by a single route.
- `src/api/services` contains feature-specific wrappers around the generated API client.
<br>

## Deployment
This project includes a `Jenkinsfile` for use in CI/CD pipelines. Jenkins must be configured with:

- Docker support
<br><br>

## License
This project is licensed under the GNU General Public License. See `LICENSE.md` for details.
<br><br>

## Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.
