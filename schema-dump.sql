

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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






CREATE OR REPLACE FUNCTION "public"."clean_old_analytics_events"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_analytics_events"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_old_error_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_error_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_old_system_metrics"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.system_health_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_system_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_project_descriptions"() RETURNS TABLE("cleaned_count" integer, "cleaned_project_ids" "uuid"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  project_record RECORD;
  cleaned_ids UUID[] := '{}';
  count_cleaned INTEGER := 0;
BEGIN
  -- Find projects with expired privacy deletion dates
  FOR project_record IN 
    SELECT id, name
    FROM public.projects 
    WHERE privacy_delete_description_after IS NOT NULL 
    AND privacy_delete_description_after <= NOW()
    AND description IS NOT NULL
  LOOP
    -- Clear the description and mark as cleaned
    UPDATE public.projects 
    SET 
      description = NULL,
      privacy_cleaned_at = NOW()
    WHERE id = project_record.id;
    
    -- Track cleaned project
    cleaned_ids := array_append(cleaned_ids, project_record.id);
    count_cleaned := count_cleaned + 1;
    
    -- Log the cleanup action
    INSERT INTO public.audit_logs (
      user_id, 
      action, 
      resource_type, 
      resource_id, 
      metadata
    ) VALUES (
      NULL, -- System action
      'privacy_cleanup',
      'project_description',
      project_record.id::TEXT,
      jsonb_build_object(
        'project_name', project_record.name,
        'cleaned_at', NOW()
      )
    );
  END LOOP;
  
  RETURN QUERY SELECT count_cleaned, cleaned_ids;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_project_descriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_srs_state_for_flashcard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.srs_states (
        user_id,
        project_id,
        card_id,
        state,
        card_interval,
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
    SET "search_path" TO 'public'
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
    SET "search_path" TO 'public'
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
    SET "search_path" TO 'public'
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
    SET "search_path" TO 'public'
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


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_study_goals_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_study_goals_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_study_reminders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_study_reminders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(255) NOT NULL,
    "user_id" "uuid",
    "session_id" character varying(255) NOT NULL,
    "data" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'User activity and application analytics events';



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


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cheatsheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cheatsheets_title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."cheatsheets" OWNER TO "postgres";


COMMENT ON TABLE "public"."cheatsheets" IS 'User-generated cheatsheets with structured content sections';



COMMENT ON COLUMN "public"."cheatsheets"."content" IS 'JSONB structure containing sections, topics, and key points';



COMMENT ON COLUMN "public"."cheatsheets"."tags" IS 'Array of string tags for categorization';



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


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_type" character varying(255) NOT NULL,
    "severity" character varying(20) NOT NULL,
    "message" "text" NOT NULL,
    "stack_trace" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "session_id" character varying(255),
    "url" "text",
    "user_agent" "text",
    "context" "jsonb",
    "resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "error_logs_severity_check" CHECK ((("severity")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[])))
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."error_logs" IS 'Application error tracking and logging';



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
    "onboarding_completed" boolean DEFAULT false NOT NULL,
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
    "privacy_delete_description_after" timestamp with time zone,
    "privacy_cleaned_at" timestamp with time zone,
    "category" "text",
    "study_intensity" "jsonb",
    "study_schedule" "text",
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


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "time_spent_seconds" integer,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quiz_attempts_score_check" CHECK (("score" >= 0)),
    CONSTRAINT "quiz_attempts_time_spent_check" CHECK ((("time_spent_seconds" IS NULL) OR ("time_spent_seconds" >= 0))),
    CONSTRAINT "quiz_attempts_total_questions_check" CHECK (("total_questions" > 0))
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_attempts" IS 'User quiz attempts with scoring and timing data';



COMMENT ON COLUMN "public"."quiz_attempts"."answers" IS 'JSONB object mapping question IDs to user answers';



COMMENT ON COLUMN "public"."quiz_attempts"."time_spent_seconds" IS 'Time spent on quiz in seconds (nullable)';



CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "questions" "jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quizzes_title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


COMMENT ON TABLE "public"."quizzes" IS 'User-generated quizzes with various question types';



COMMENT ON COLUMN "public"."quizzes"."questions" IS 'JSONB array of question objects with type, question, options, and correct answers';



COMMENT ON COLUMN "public"."quizzes"."settings" IS 'JSONB object with quiz settings like time limits, randomization, etc.';



COMMENT ON COLUMN "public"."quizzes"."tags" IS 'Array of string tags for categorization';



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


CREATE TABLE IF NOT EXISTS "public"."study_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_type" "text" NOT NULL,
    "target_value" integer NOT NULL,
    "current_value" integer DEFAULT 0,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "study_goals_current_value_check" CHECK (("current_value" >= 0)),
    CONSTRAINT "study_goals_goal_type_check" CHECK (("goal_type" = ANY (ARRAY['daily_new_cards'::"text", 'daily_reviews'::"text", 'daily_time'::"text", 'weekly_streak'::"text", 'monthly_cards'::"text"]))),
    CONSTRAINT "study_goals_target_value_check" CHECK (("target_value" > 0)),
    CONSTRAINT "valid_period" CHECK (("period_start" <= "period_end"))
);


ALTER TABLE "public"."study_goals" OWNER TO "postgres";


COMMENT ON TABLE "public"."study_goals" IS 'User study goals and progress tracking';



COMMENT ON COLUMN "public"."study_goals"."goal_type" IS 'Type of study goal (daily_new_cards, daily_reviews, daily_time, weekly_streak, monthly_cards)';



COMMENT ON COLUMN "public"."study_goals"."target_value" IS 'Target value for the goal (cards, minutes, days, etc.)';



COMMENT ON COLUMN "public"."study_goals"."current_value" IS 'Current progress towards the goal';



COMMENT ON COLUMN "public"."study_goals"."period_start" IS 'Start date of the goal period';



COMMENT ON COLUMN "public"."study_goals"."period_end" IS 'End date of the goal period';



COMMENT ON COLUMN "public"."study_goals"."is_active" IS 'Whether the goal is currently active';



CREATE TABLE IF NOT EXISTS "public"."study_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "reminder_type" "text" NOT NULL,
    "scheduled_time" time without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_sent" timestamp with time zone,
    "notification_method" "text" DEFAULT 'browser'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "study_reminders_notification_method_check" CHECK (("notification_method" = ANY (ARRAY['browser'::"text", 'email'::"text", 'both'::"text"]))),
    CONSTRAINT "study_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['daily_study'::"text", 'due_reviews'::"text", 'learning_cards'::"text", 'goal_check'::"text"])))
);


ALTER TABLE "public"."study_reminders" OWNER TO "postgres";


COMMENT ON TABLE "public"."study_reminders" IS 'User study reminders and notification scheduling';



COMMENT ON COLUMN "public"."study_reminders"."reminder_type" IS 'Type of study reminder (daily_study, due_reviews, learning_cards, goal_check)';



COMMENT ON COLUMN "public"."study_reminders"."scheduled_time" IS 'Time of day when reminder should be sent';



COMMENT ON COLUMN "public"."study_reminders"."is_active" IS 'Whether the reminder is currently active';



COMMENT ON COLUMN "public"."study_reminders"."last_sent" IS 'Timestamp when this reminder was last sent';



COMMENT ON COLUMN "public"."study_reminders"."notification_method" IS 'How the reminder should be delivered (browser, email, both)';



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


CREATE TABLE IF NOT EXISTS "public"."system_health_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "database_response_time" integer,
    "memory_usage" numeric,
    "active_users" integer DEFAULT 0,
    "requests_per_minute" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "metrics" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_health_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_health_metrics" IS 'System performance and health monitoring metrics';



CREATE TABLE IF NOT EXISTS "public"."user_ai_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "system_prompt" "text",
    "user_template" "text",
    "complexity" "text" DEFAULT 'medium'::"text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_ai_prompts" OWNER TO "postgres";


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


ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_pkey" PRIMARY KEY ("user_id", "notification_id");



ALTER TABLE ONLY "public"."app_notifications"
    ADD CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cheatsheets"
    ADD CONSTRAINT "cheatsheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_user_id_project_id_study_date_key" UNIQUE ("user_id", "project_id", "study_date");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_user_id_project_id_card_id_key" UNIQUE ("user_id", "project_id", "card_id");



ALTER TABLE ONLY "public"."study_goals"
    ADD CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_reminders"
    ADD CONSTRAINT "study_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_metrics"
    ADD CONSTRAINT "system_health_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_goals"
    ADD CONSTRAINT "unique_active_goal" UNIQUE ("user_id", "goal_type", "period_start", "period_end") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."user_ai_prompts"
    ADD CONSTRAINT "user_ai_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_analytics_events_timestamp" ON "public"."analytics_events" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_app_notification_reads_notification_id" ON "public"."app_notification_reads" USING "btree" ("notification_id");



CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_user_timestamp" ON "public"."audit_logs" USING "btree" ("user_id", "timestamp" DESC);



CREATE INDEX "idx_cheatsheets_created_at" ON "public"."cheatsheets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cheatsheets_project_id" ON "public"."cheatsheets" USING "btree" ("project_id");



CREATE INDEX "idx_daily_study_stats_project_id" ON "public"."daily_study_stats" USING "btree" ("project_id");



CREATE INDEX "idx_daily_study_stats_user_date_desc" ON "public"."daily_study_stats" USING "btree" ("user_id", "study_date" DESC);



CREATE INDEX "idx_error_logs_resolved" ON "public"."error_logs" USING "btree" ("resolved");



CREATE INDEX "idx_error_logs_severity" ON "public"."error_logs" USING "btree" ("severity");



CREATE INDEX "idx_error_logs_timestamp" ON "public"."error_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_error_logs_type" ON "public"."error_logs" USING "btree" ("error_type");



CREATE INDEX "idx_error_logs_user_id" ON "public"."error_logs" USING "btree" ("user_id");



CREATE INDEX "idx_flashcards_project_id" ON "public"."flashcards" USING "btree" ("project_id");



CREATE INDEX "idx_projects_privacy_deletion" ON "public"."projects" USING "btree" ("privacy_delete_description_after") WHERE ("privacy_delete_description_after" IS NOT NULL);



CREATE INDEX "idx_projects_user_created" ON "public"."projects" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_quiz_attempts_completed_at" ON "public"."quiz_attempts" USING "btree" ("completed_at" DESC);



CREATE INDEX "idx_quiz_attempts_quiz_id" ON "public"."quiz_attempts" USING "btree" ("quiz_id");



CREATE INDEX "idx_quiz_attempts_user_id" ON "public"."quiz_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_quizzes_created_at" ON "public"."quizzes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_quizzes_project_id" ON "public"."quizzes" USING "btree" ("project_id");



CREATE INDEX "idx_srs_states_card_id" ON "public"."srs_states" USING "btree" ("card_id");



CREATE INDEX "idx_srs_states_project_id" ON "public"."srs_states" USING "btree" ("project_id");



CREATE INDEX "idx_srs_states_session" ON "public"."srs_states" USING "btree" ("last_session_id") WHERE ("last_session_id" IS NOT NULL);



CREATE INDEX "idx_srs_states_user_due_suspended" ON "public"."srs_states" USING "btree" ("user_id", "due", "is_suspended") WHERE ("is_suspended" = false);



CREATE INDEX "idx_srs_states_user_project_state_due" ON "public"."srs_states" USING "btree" ("user_id", "project_id", "state", "due");



CREATE INDEX "idx_study_goals_active" ON "public"."study_goals" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_study_goals_period" ON "public"."study_goals" USING "btree" ("user_id", "period_start", "period_end");



CREATE INDEX "idx_study_goals_user_id" ON "public"."study_goals" USING "btree" ("user_id");



CREATE INDEX "idx_study_reminders_active" ON "public"."study_reminders" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_study_reminders_project" ON "public"."study_reminders" USING "btree" ("user_id", "project_id");



CREATE INDEX "idx_study_reminders_schedule" ON "public"."study_reminders" USING "btree" ("user_id", "scheduled_time", "is_active");



CREATE INDEX "idx_study_reminders_user_id" ON "public"."study_reminders" USING "btree" ("user_id");



CREATE INDEX "idx_study_sessions_user_active" ON "public"."study_sessions" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_system_health_timestamp" ON "public"."system_health_metrics" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_user_ai_prompts_user_id" ON "public"."user_ai_prompts" USING "btree" ("user_id");



CREATE INDEX "idx_user_notifications_project_id" ON "public"."user_notifications" USING "btree" ("project_id");



CREATE INDEX "idx_user_notifications_user_scheduled" ON "public"."user_notifications" USING "btree" ("user_id", "scheduled_for") WHERE ("is_read" = false);



CREATE OR REPLACE TRIGGER "create_srs_state_trigger" AFTER INSERT ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."create_srs_state_for_flashcard"();



CREATE OR REPLACE TRIGGER "set_timestamp_error_logs" BEFORE UPDATE ON "public"."error_logs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "study_goals_updated_at" BEFORE UPDATE ON "public"."study_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_study_goals_updated_at"();



CREATE OR REPLACE TRIGGER "study_reminders_updated_at" BEFORE UPDATE ON "public"."study_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."update_study_reminders_updated_at"();



CREATE OR REPLACE TRIGGER "update_cheatsheets_updated_at" BEFORE UPDATE ON "public"."cheatsheets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_study_stats_updated_at" BEFORE UPDATE ON "public"."daily_study_stats" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_flashcards_updated_at" BEFORE UPDATE ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quizzes_updated_at" BEFORE UPDATE ON "public"."quizzes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_srs_states_updated_at" BEFORE UPDATE ON "public"."srs_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."app_notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cheatsheets"
    ADD CONSTRAINT "cheatsheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_goals"
    ADD CONSTRAINT "study_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_reminders"
    ADD CONSTRAINT "study_reminders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_reminders"
    ADD CONSTRAINT "study_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Admin delete error logs" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin read all analytics" ON "public"."analytics_events" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "Admin read audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin read error logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin system health access" ON "public"."system_health_metrics" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin update error logs" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow error reporting" ON "public"."error_logs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "System insert audit logs" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can delete their own study goals" ON "public"."study_goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own study reminders" ON "public"."study_reminders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own study goals" ON "public"."study_goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own study reminders" ON "public"."study_reminders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can track own events" ON "public"."analytics_events" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update their own study goals" ON "public"."study_goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own study reminders" ON "public"."study_reminders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own study goals" ON "public"."study_goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own study reminders" ON "public"."study_reminders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_notification_reads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notification_reads_policy" ON "public"."app_notification_reads" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notifications_select" ON "public"."app_notifications" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cheatsheets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cheatsheets_policy" ON "public"."cheatsheets" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."daily_study_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_study_stats_policy" ON "public"."daily_study_stats" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "flashcards_policy" ON "public"."flashcards" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_policy" ON "public"."profiles" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_policy" ON "public"."projects" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_attempts_policy" ON "public"."quiz_attempts" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quizzes_policy" ON "public"."quizzes" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."srs_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "srs_states_policy" ON "public"."srs_states" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."study_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "study_sessions_policy" ON "public"."study_sessions" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."system_health_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ai_prompts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_ai_prompts_policy" ON "public"."user_ai_prompts" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_notifications_policy" ON "public"."user_notifications" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_policy" ON "public"."user_settings" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."clean_old_analytics_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_analytics_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_old_error_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_error_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_old_system_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_system_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_project_descriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_project_descriptions"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_study_goals_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_study_goals_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_study_reminders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_study_reminders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."analytics_events" TO "anon";



GRANT ALL ON TABLE "public"."app_notification_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notification_reads" TO "service_role";



GRANT ALL ON TABLE "public"."app_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cheatsheets" TO "authenticated";
GRANT ALL ON TABLE "public"."cheatsheets" TO "service_role";



GRANT ALL ON TABLE "public"."daily_study_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_study_stats" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."error_logs" TO "anon";



GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."srs_states" TO "authenticated";
GRANT ALL ON TABLE "public"."srs_states" TO "service_role";



GRANT ALL ON TABLE "public"."study_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."study_goals" TO "service_role";



GRANT ALL ON TABLE "public"."study_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."study_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."study_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."study_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_prompts" TO "service_role";



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
