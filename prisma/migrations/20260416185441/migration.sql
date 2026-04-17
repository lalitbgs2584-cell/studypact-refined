-- CreateIndex
CREATE INDEX "task_userId_scope_status_idx" ON "task"("userId", "scope", "status");

-- CreateIndex
CREATE INDEX "task_groupId_scope_dueAt_idx" ON "task"("groupId", "scope", "dueAt");

-- CreateIndex
CREATE INDEX "task_userId_status_dueAt_idx" ON "task"("userId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "user_group_userId_role_idx" ON "user_group"("userId", "role");

-- CreateIndex
CREATE INDEX "user_group_groupId_role_idx" ON "user_group"("groupId", "role");
