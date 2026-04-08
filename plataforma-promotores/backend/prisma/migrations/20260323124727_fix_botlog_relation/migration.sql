-- DropIndex
DROP INDEX "bot_logs_idTramite_key";

-- DropIndex
DROP INDEX "tramites_botLogId_key";

-- CreateIndex
CREATE INDEX "bot_logs_idTramite_idx" ON "bot_logs"("idTramite");
