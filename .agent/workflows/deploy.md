---
description: Deploy to remote server (Commit, Push, Pull & Build)
---
1. Summarize the recent changes to the codebase.
2. Stage all changes:
   ```bash
   git add .
   ```
3. Commit the changes with a descriptive message based on the summary.
4. Push the changes to the remote repository:
   ```bash
   git push
   ```
// turbo
5. Run the deployment command on the remote server:
   ```bash
   ssh zhaofanghan@10.184.17.30 "bash -i -c 'cd /data1/zhaofanghan/VLMSimliarityScore && git pull && npm install && npm run build'"
   ```
