-- 006_chat_message_meta.sql
-- Store full AI response metadata (context_used, project, sources) per saved message.

ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;
