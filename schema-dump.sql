

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "user_data";


ALTER SCHEMA "user_data" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_buffercache" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_srs_state_for_flashcard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.srs_states (
        user_id,
        project_id,
        card_id,
        state,
        card_interval,  -- Fixed: was 'interval'
        ease,
        due,
        last_reviewed,
        repetitions,
        lapses,
        learning_step,
        is_leech,
        is_suspended
    ) VALUES (
        (SELECT user_id FROM public.projects WHERE id = NEW.project_id),
        NEW.project_id,
        NEW.id,
        'new',
        1, -- 1 minute initial interval
        2.5, -- default ease
        NEW.created_at, -- new cards available immediately
        null, -- not reviewed yet
        0, -- no repetitions
        0, -- no lapses
        0, -- learning step 0
        false, -- not a leech
        false -- not suspended
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_srs_state_for_flashcard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."end_study_session"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- End the session
    UPDATE public.study_sessions
    SET ended_at = now(), is_active = false
    WHERE id = p_session_id;
    
    -- Clear session tracking from SRS states
    UPDATE public.srs_states
    SET last_session_id = null,
        session_started_at = null
    WHERE last_session_id = p_session_id;
END;
$$;


ALTER FUNCTION "public"."end_study_session"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("card_id" "uuid", "project_id" "uuid", "due" timestamp with time zone, "state" "text", "front" "text", "back" "text", "card_interval" integer, "ease" real, "learning_step" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT 
        ss.card_id,
        ss.project_id,
        ss.due,
        ss.state,
        f.front,
        f.back,
        ss.card_interval,
        ss.ease,
        ss.learning_step
    FROM public.srs_states ss
    INNER JOIN public.flashcards f ON ss.card_id = f.id
    WHERE ss.user_id = p_user_id 
        AND ss.project_id = p_project_id
        AND ss.due <= NOW()
        AND ss.is_suspended = false
        AND (ss.last_session_id IS NULL OR ss.state NOT IN ('learning', 'relearning'))
    ORDER BY 
        CASE ss.state
            WHEN 'new' THEN 1
            WHEN 'learning' THEN 2
            WHEN 'relearning' THEN 3
            WHEN 'review' THEN 4
        END,
        ss.due ASC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, display_name, avatar_url, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email
    );
    
    -- Create user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_study_session"("p_user_id" "uuid", "p_project_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    session_id uuid;
BEGIN
    -- End any active sessions for this user/project
    UPDATE public.study_sessions 
    SET ended_at = now(), is_active = false 
    WHERE user_id = p_user_id 
        AND project_id = p_project_id 
        AND is_active = true;
    
    -- Create new session
    INSERT INTO public.study_sessions (user_id, project_id)
    VALUES (p_user_id, p_project_id)
    RETURNING id INTO session_id;
    
    -- Mark learning cards as belonging to this session
    UPDATE public.srs_states
    SET last_session_id = session_id,
        session_started_at = now()
    WHERE user_id = p_user_id
        AND project_id = p_project_id
        AND state IN ('learning', 'relearning')
        AND due <= now();
    
    RETURN session_id;
END;
$$;


ALTER FUNCTION "public"."start_study_session"("p_user_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_notification_reads" (
    "user_id" "uuid" NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_notification_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "url" "text",
    "published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_study_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "study_date" "date" NOT NULL,
    "new_cards_studied" integer DEFAULT 0 NOT NULL,
    "reviews_completed" integer DEFAULT 0 NOT NULL,
    "time_spent_seconds" integer DEFAULT 0 NOT NULL,
    "cards_learned" integer DEFAULT 0 NOT NULL,
    "cards_lapsed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_study_stats_cards_lapsed_check" CHECK (("cards_lapsed" >= 0)),
    CONSTRAINT "daily_study_stats_cards_learned_check" CHECK (("cards_learned" >= 0)),
    CONSTRAINT "daily_study_stats_new_cards_studied_check" CHECK (("new_cards_studied" >= 0)),
    CONSTRAINT "daily_study_stats_reviews_completed_check" CHECK (("reviews_completed" >= 0)),
    CONSTRAINT "daily_study_stats_time_spent_seconds_check" CHECK (("time_spent_seconds" >= 0))
);


ALTER TABLE "public"."daily_study_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "extra" "jsonb" DEFAULT '{}'::"jsonb",
    "is_ai_generated" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "flashcards_back_not_empty" CHECK (("length"(TRIM(BOTH FROM "back")) > 0)),
    CONSTRAINT "flashcards_front_not_empty" CHECK (("length"(TRIM(BOTH FROM "front")) > 0))
);


ALTER TABLE "public"."flashcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "display_name" "text",
    "bio" "text",
    "avatar_url" "text",
    "email" "text",
    "age" integer,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_age_range" CHECK ((("age" IS NULL) OR (("age" >= 13) AND ("age" <= 120)))),
    CONSTRAINT "profiles_username_format" CHECK (("username" ~ '^[a-zA-Z0-9_-]+$'::"text")),
    CONSTRAINT "profiles_username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 30)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "new_cards_per_day" integer DEFAULT 20 NOT NULL,
    "max_reviews_per_day" integer DEFAULT 100 NOT NULL,
    "learning_steps" integer[] DEFAULT ARRAY[1, 10] NOT NULL,
    "relearning_steps" integer[] DEFAULT ARRAY[10] NOT NULL,
    "graduating_interval" integer DEFAULT 1 NOT NULL,
    "easy_interval" integer DEFAULT 4 NOT NULL,
    "starting_ease" real DEFAULT 2.5 NOT NULL,
    "minimum_ease" real DEFAULT 1.3 NOT NULL,
    "easy_bonus" real DEFAULT 1.3 NOT NULL,
    "hard_interval_factor" real DEFAULT 1.2 NOT NULL,
    "easy_interval_factor" real DEFAULT 1.3 NOT NULL,
    "lapse_recovery_factor" real DEFAULT 0.2 NOT NULL,
    "leech_threshold" integer DEFAULT 8 NOT NULL,
    "leech_action" "text" DEFAULT 'suspend'::"text" NOT NULL,
    "new_card_order" "text" DEFAULT 'random'::"text" NOT NULL,
    "review_ahead" boolean DEFAULT false NOT NULL,
    "bury_siblings" boolean DEFAULT false NOT NULL,
    "max_interval" integer DEFAULT 36500 NOT NULL,
    "lapse_ease_penalty" real DEFAULT 0.2 NOT NULL,
    CONSTRAINT "projects_easy_bonus_check" CHECK ((("easy_bonus" >= (1.0)::double precision) AND ("easy_bonus" <= (2.0)::double precision))),
    CONSTRAINT "projects_easy_interval_check" CHECK (("easy_interval" >= 1)),
    CONSTRAINT "projects_easy_interval_factor_check" CHECK ((("easy_interval_factor" >= (1.0)::double precision) AND ("easy_interval_factor" <= (2.0)::double precision))),
    CONSTRAINT "projects_graduating_interval_check" CHECK (("graduating_interval" >= 1)),
    CONSTRAINT "projects_hard_interval_factor_check" CHECK ((("hard_interval_factor" >= (0.1)::double precision) AND ("hard_interval_factor" <= (2.0)::double precision))),
    CONSTRAINT "projects_lapse_ease_penalty_check" CHECK ((("lapse_ease_penalty" >= (0.1)::double precision) AND ("lapse_ease_penalty" <= (1.0)::double precision))),
    CONSTRAINT "projects_lapse_recovery_factor_check" CHECK ((("lapse_recovery_factor" >= (0.1)::double precision) AND ("lapse_recovery_factor" <= (1.0)::double precision))),
    CONSTRAINT "projects_leech_action_check" CHECK (("leech_action" = ANY (ARRAY['suspend'::"text", 'tag'::"text"]))),
    CONSTRAINT "projects_leech_threshold_check" CHECK ((("leech_threshold" >= 1) AND ("leech_threshold" <= 20))),
    CONSTRAINT "projects_max_interval_check" CHECK ((("max_interval" >= 1) AND ("max_interval" <= 36500))),
    CONSTRAINT "projects_max_reviews_per_day_check" CHECK (("max_reviews_per_day" >= 0)),
    CONSTRAINT "projects_minimum_ease_check" CHECK ((("minimum_ease" >= (1.0)::double precision) AND ("minimum_ease" <= (3.0)::double precision))),
    CONSTRAINT "projects_new_card_order_check" CHECK (("new_card_order" = ANY (ARRAY['random'::"text", 'fifo'::"text"]))),
    CONSTRAINT "projects_new_cards_per_day_check" CHECK (("new_cards_per_day" >= 0)),
    CONSTRAINT "projects_starting_ease_check" CHECK ((("starting_ease" >= (1.3)::double precision) AND ("starting_ease" <= (5.0)::double precision)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."srs_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "state" "text" DEFAULT 'new'::"text" NOT NULL,
    "card_interval" integer DEFAULT 1 NOT NULL,
    "ease" real DEFAULT 2.5 NOT NULL,
    "due" timestamp with time zone NOT NULL,
    "last_reviewed" timestamp with time zone,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "lapses" integer DEFAULT 0 NOT NULL,
    "learning_step" integer DEFAULT 0 NOT NULL,
    "is_leech" boolean DEFAULT false NOT NULL,
    "is_suspended" boolean DEFAULT false NOT NULL,
    "last_session_id" "uuid",
    "session_started_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "srs_states_ease_bounds" CHECK ((("ease" >= (1.0)::double precision) AND ("ease" <= (5.0)::double precision))),
    CONSTRAINT "srs_states_interval_positive" CHECK (("card_interval" > 0)),
    CONSTRAINT "srs_states_lapses_non_negative" CHECK (("lapses" >= 0)),
    CONSTRAINT "srs_states_learning_step_non_negative" CHECK (("learning_step" >= 0)),
    CONSTRAINT "srs_states_repetitions_non_negative" CHECK (("repetitions" >= 0)),
    CONSTRAINT "srs_states_state_check" CHECK (("state" = ANY (ARRAY['new'::"text", 'learning'::"text", 'review'::"text", 'relearning'::"text"])))
);


ALTER TABLE "public"."srs_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "cards_studied" integer DEFAULT 0 NOT NULL,
    "time_spent_seconds" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."study_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "url" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "scheduled_for" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_notifications_type_check" CHECK (("type" = ANY (ARRAY['study_reminder'::"text", 'general'::"text", 'achievement'::"text"])))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "daily_reminder" boolean DEFAULT true NOT NULL,
    "reminder_time" time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_settings_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_pkey" PRIMARY KEY ("user_id", "notification_id");



ALTER TABLE ONLY "public"."app_notifications"
    ADD CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_user_id_project_id_study_date_key" UNIQUE ("user_id", "project_id", "study_date");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_user_id_project_id_card_id_key" UNIQUE ("user_id", "project_id", "card_id");



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_app_notification_reads_notification_id" ON "public"."app_notification_reads" USING "btree" ("notification_id");



CREATE INDEX "idx_daily_study_stats_project_id" ON "public"."daily_study_stats" USING "btree" ("project_id");



CREATE INDEX "idx_daily_study_stats_user_date_desc" ON "public"."daily_study_stats" USING "btree" ("user_id", "study_date" DESC);



CREATE INDEX "idx_flashcards_project_id" ON "public"."flashcards" USING "btree" ("project_id");



CREATE INDEX "idx_projects_user_created" ON "public"."projects" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_srs_states_card_id" ON "public"."srs_states" USING "btree" ("card_id");



CREATE INDEX "idx_srs_states_project_id" ON "public"."srs_states" USING "btree" ("project_id");



CREATE INDEX "idx_srs_states_session" ON "public"."srs_states" USING "btree" ("last_session_id") WHERE ("last_session_id" IS NOT NULL);



CREATE INDEX "idx_srs_states_user_due_suspended" ON "public"."srs_states" USING "btree" ("user_id", "due", "is_suspended") WHERE ("is_suspended" = false);



CREATE INDEX "idx_srs_states_user_project_state_due" ON "public"."srs_states" USING "btree" ("user_id", "project_id", "state", "due");



CREATE INDEX "idx_study_sessions_user_active" ON "public"."study_sessions" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_notifications_project_id" ON "public"."user_notifications" USING "btree" ("project_id");



CREATE INDEX "idx_user_notifications_user_scheduled" ON "public"."user_notifications" USING "btree" ("user_id", "scheduled_for") WHERE ("is_read" = false);



CREATE OR REPLACE TRIGGER "create_srs_state_trigger" AFTER INSERT ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."create_srs_state_for_flashcard"();



CREATE OR REPLACE TRIGGER "update_daily_study_stats_updated_at" BEFORE UPDATE ON "public"."daily_study_stats" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_flashcards_updated_at" BEFORE UPDATE ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_srs_states_updated_at" BEFORE UPDATE ON "public"."srs_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."app_notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."app_notification_reads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notification_reads_policy" ON "public"."app_notification_reads" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."app_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notifications_select" ON "public"."app_notifications" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."daily_study_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_study_stats_policy" ON "public"."daily_study_stats" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."flashcards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "flashcards_policy" ON "public"."flashcards" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"())))) WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_policy" ON "public"."profiles" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_policy" ON "public"."projects" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."srs_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "srs_states_policy" ON "public"."srs_states" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."study_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "study_sessions_policy" ON "public"."study_sessions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_notifications_policy" ON "public"."user_notifications" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_policy" ON "public"."user_settings" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."create_srs_state_for_flashcard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_srs_state_for_flashcard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."end_study_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."end_study_session"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."start_study_session"("p_user_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_study_session"("p_user_id" "uuid", "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."app_notification_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notification_reads" TO "service_role";



GRANT ALL ON TABLE "public"."app_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."daily_study_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_study_stats" TO "service_role";



GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."srs_states" TO "authenticated";
GRANT ALL ON TABLE "public"."srs_states" TO "service_role";



GRANT ALL ON TABLE "public"."study_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."study_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
