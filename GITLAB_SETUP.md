# Running GitLab Locally with Podman

This project requires a local GitLab CE instance for CI/CD. The container can be run directly with `podman` using environment variables defined in a `.env` file.

## 1. Prepare the environment

1. Copy the provided example and update values as needed:

   ```bash
   cp .env.example .env
   # edit .env to set hostname, ports and credentials
   ```

2. Load the variables into your current shell:

   ```bash
   . ./.env
   ```

## 2. Start GitLab

Run GitLab CE with podman-compose

```bash
podman-compose -f gitlab-compose.yaml up -d gitlab
```

GitLab will be accessible at `$GITLAB_URL` once the container finishes booting.

## 3. Setting the Initial Root Password

After the container is running, you can set the root password manually using the GitLab Rails console:

```bash
podman exec -it gitlab bash
gitlab-rails console
```

Then run:

```ruby
user = User.where(id: 1).first
user.password = 'YourSecurePassword'
user.password_confirmation = 'YourSecurePassword'
user.save!
exit
```

Finally, restart GitLab services:

```bash
gitlab-ctl restart
exit
```

The default username is `root`.

## 4. Set Up Personal Access Token

To authenticate Git operations over HTTPS, create a Personal Access Token (PAT):

1. Log in to your GitLab instance.
2. Click on your avatar in the top-right corner and select **Edit profile**.
3. In the left sidebar, click on **Access Tokens**.
4. Fill in the **Name**, set an **Expiration date**, and select the scopes:
   - `api`
   - `write_repository`
5. Click **Create personal access token**.
6. **Copy and save the token securely**; it won't be shown again.

Use this token as your password when performing Git operations over HTTPS.

When pushing code, Git will prompt for credentials:

```bash
git push gitlab main
```

Enter `root` as the username and your newly created PAT as the password.


## 5. Create Group and Project
To prepare your GitLab instance for pushing this codebase:

1. Log in to GitLab at `$GITLAB_URL`

2. Navigate to `Groups → Your Groups → New Group` and create a group using the name set in `.env` as `$GITLAB_GROUP`

3. After the group is created, click New Project inside that group.

4. Use the value of `$GITLAB_PROJECT` from `.env` as the project name.

## 6. Import this project

1. Create a new group `$GITLAB_GROUP` and project `$GITLAB_PROJECT` in your GitLab instance.

2. Push the repository to the new project:

   ```bash
   git remote add gitlab "$GITLAB_URL/${GITLAB_GROUP}/${GITLAB_PROJECT}.git"
   git push gitlab main
   ```

3. GitLab will automatically run the pipeline defined in `.gitlab-ci.yml`.

After the initial pipeline completes, you can continue using GitLab for CI/CD and container registry hosting.

## 7. GitLab Runner Setup

To enable CI/CD for this project, you need to register a GitLab Runner. You can either run it via Podman or install it locally on your Mac.

### Run GitLab Runner with Podman (Containerized)

Recommended for isolated builds or headless CI setups

```bash
podman-compose up -d gitlab-runner
```

The container shares the host's Podman socket for Docker-compatible builds.

