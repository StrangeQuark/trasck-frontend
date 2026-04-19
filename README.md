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

### API Client Generation
The frontend keeps a generated TypeScript API client under `src/api/generated`. Start the Trasck backend, then regenerate the client when the backend OpenAPI contract changes:

```
npm run generate:api
```

By default the generator reads `http://localhost:6100/v3/api-docs`. Override it with `TRASCK_OPENAPI_URL` for another running backend, or `TRASCK_OPENAPI_SOURCE` to generate from a local OpenAPI JSON file.
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
