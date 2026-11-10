# Deploy tms_new to K3s

This is a single-node lab deployment for the existing K3s VM. It uses the release images from GHCR and PostgreSQL storage on the node's default local-path provisioner.

## Prepare

1. Make sure the GitHub Actions run for `main` is green.
2. Create and publish a GitHub release, for example `v0.1.0`. The release workflow builds `linux/amd64` and `linux/arm64` images for GHCR.
3. Create a GitHub PAT with `read:packages` permission for pulling private GHCR packages. Do not put it in Git or in the inventory.
4. In WSL at the repository root:

   ```bash
   cp ansible/inventory.example.yml ansible/inventory.yml
   ```

   Update the VM IP if DHCP changed it. The current example uses `192.168.88.141` and SSH user `sana`.

5. Run the deployment playbook:

   ```bash
   ansible-playbook -i ansible/inventory.yml ansible/playbooks/deploy-tms.yml
   ```

   Enter the release tag, GitHub username, GHCR token, a new PostgreSQL password, and a random JWT secret when prompted. Secrets are applied to K3s from temporary files with restrictive permissions; the files are removed afterward.

## Access and first data

The app is exposed through Traefik on HTTP. From the host browser, open `http://192.168.88.141` (replace with the VM's current address). Swagger is at `/api/docs`.

The database starts empty. The repository's `backend/src/seed.ts` creates demo accounts with known passwords. Run it only in this isolated lab, then change every seeded password before exposing the app outside your private network. Never seed production data with those defaults.

## Lab limitations

This is an educational demo, not a production setup. TypeORM currently uses `synchronize: true`, CORS accepts any origin with credentials, ingress is HTTP, and PostgreSQL has no backup or high availability. Do not expose it publicly or enter real personal data until migrations, CORS, TLS, backups, and credential management are fixed.
