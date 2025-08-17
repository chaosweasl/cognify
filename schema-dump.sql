

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






CREATE OR REPLACE FUNCTION "public"."can_user_make_request"("p_user_id" "uuid", "p_estimated_credits" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_plan RECORD;
    v_kill_switch BOOLEAN;
BEGIN
    -- Check global kill switch
    SELECT (value::text)::boolean INTO v_kill_switch 
    FROM public.system_config WHERE key = 'ai_kill_switch';
    
    IF v_kill_switch THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SERVICE_TEMPORARILY_UNAVAILABLE',
            'message', 'AI services are temporarily unavailable. Please try again later.'
        );
    END IF;

    -- Get user plan limits
    SELECT * INTO v_plan FROM public.get_user_plan_limits(p_user_id);
    
    IF v_plan.plan_name IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'NO_ACTIVE_PLAN',
            'message', 'No active subscription found. Please subscribe to continue.'
        );
    END IF;

    -- Check per-request limit
    IF p_estimated_credits > v_plan.max_per_request_credits THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'REQUEST_TOO_LARGE',
            'message', format('Request requires %s credits but maximum per request is %s', 
                            p_estimated_credits, v_plan.max_per_request_credits)
        );
    END IF;

    -- Check daily limit
    IF p_estimated_credits > v_plan.daily_credits_remaining THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'DAILY_LIMIT_EXCEEDED',
            'message', format('Request requires %s credits but you have %s remaining today', 
                            p_estimated_credits, v_plan.daily_credits_remaining)
        );
    END IF;

    -- Check monthly limit
    IF p_estimated_credits > v_plan.credits_remaining THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'MONTHLY_LIMIT_EXCEEDED',
            'message', format('Request requires %s credits but you have %s remaining this month', 
                            p_estimated_credits, v_plan.credits_remaining)
        );
    END IF;

    -- All checks passed
    RETURN jsonb_build_object(
        'allowed', true,
        'plan_name', v_plan.plan_name,
        'credits_required', p_estimated_credits,
        'daily_remaining_after', v_plan.daily_credits_remaining - p_estimated_credits,
        'monthly_remaining_after', v_plan.credits_remaining - p_estimated_credits
    );
END;
$$;


ALTER FUNCTION "public"."can_user_make_request"("p_user_id" "uuid", "p_estimated_credits" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- If foreign key constraint fails, log and continue
    RAISE LOG 'Foreign key violation in create_default_user_settings for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log other errors but don't fail
    RAISE LOG 'Error in create_default_user_settings for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    new_flashcard_id UUID;
    project_user_id UUID;
BEGIN
    -- Verify user owns the project
    SELECT user_id INTO project_user_id 
    FROM public.projects 
    WHERE id = p_project_id;
    
    IF project_user_id IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    IF project_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access to project';
    END IF;
    
    -- Insert flashcard
    INSERT INTO public.flashcards (project_id, front, back, extra)
    VALUES (p_project_id, p_front, p_back, p_extra)
    RETURNING id INTO new_flashcard_id;
    
    -- SRS state will be created automatically by the trigger
    -- But we'll verify it was created
    IF NOT EXISTS (
        SELECT 1 FROM public.srs_states 
        WHERE card_id = new_flashcard_id 
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Failed to create SRS state for flashcard';
    END IF;
    
    RETURN new_flashcard_id;
END;
$$;


ALTER FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb") IS 'Atomically creates a flashcard and its SRS state with proper authorization checks';



CREATE OR REPLACE FUNCTION "public"."create_missing_profiles"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Create missing profiles
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  SELECT 
    u.id,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name', 
      u.raw_user_meta_data->>'user_name',
      split_part(u.email, '@', 1)
    ),
    COALESCE(
      u.raw_user_meta_data->>'avatar_url',
      u.raw_user_meta_data->>'picture'
    ),
    u.email
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  -- Create missing user settings with explicit valid values
  INSERT INTO public.user_settings (
    user_id,
    theme,
    notifications_enabled,
    daily_reminder,
    reminder_time,
    new_cards_per_day,
    max_reviews_per_day,
    learning_steps,
    relearning_steps,
    graduating_interval,
    easy_interval,
    starting_ease,
    minimum_ease,
    easy_bonus,
    hard_interval_factor,
    easy_interval_factor,
    lapse_recovery_factor,
    leech_threshold,
    leech_action,
    new_card_order,
    review_ahead,
    bury_siblings,
    max_interval,
    lapse_ease_penalty
  )
  SELECT 
    u.id,
    'system'::text,
    true,
    true,
    '09:00:00'::time,
    20,
    100,
    ARRAY[1, 10, 1440],
    ARRAY[10, 1440],
    1,
    4,
    2.5,
    1.3,
    1.3,
    1.0,  -- Fixed: within constraint bounds
    1.3,
    0.2,
    8,
    'suspend'::text,
    'random'::text,
    false,
    false,
    36500,
    0.2
  FROM auth.users u
  LEFT JOIN public.user_settings s ON u.id = s.user_id
  WHERE s.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_missing_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_srs_state_for_flashcard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Insert SRS state for the new flashcard
    INSERT INTO public.srs_states (
        user_id,
        project_id,
        card_id,
        interval,
        ease,
        due,
        last_reviewed,
        repetitions,
        state,
        lapses,
        learning_step,
        is_leech,
        is_suspended
    ) VALUES (
        (SELECT user_id FROM public.projects WHERE id = NEW.project_id),
        NEW.project_id,
        NEW.id,
        1,                      -- Initial interval
        2.5,                    -- Default ease factor  
        NEW.created_at,         -- New cards available immediately
        NEW.created_at,         -- Last reviewed = creation time
        0,                      -- No repetitions
        'new',                  -- New card state
        0,                      -- No lapses
        0,                      -- Learning step 0
        false,                  -- Not a leech
        false                   -- Not suspended
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_srs_state_for_flashcard"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_srs_state_for_flashcard"() IS 'Function to create initial SRS state for newly inserted flashcards';



CREATE OR REPLACE FUNCTION "public"."create_user_credit_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.user_credit_balances (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_credit_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debit_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_transaction_type" "text", "p_description" "text", "p_reference_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_balance RECORD;
    v_success BOOLEAN := false;
BEGIN
    -- Use advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text)::bigint);
    
    -- Get current balance with row lock
    SELECT * INTO v_balance 
    FROM public.user_credit_balances 
    WHERE user_id = p_user_id 
    FOR UPDATE;
    
    -- Create balance record if it doesn't exist
    IF v_balance.user_id IS NULL THEN
        INSERT INTO public.user_credit_balances (user_id) 
        VALUES (p_user_id);
        
        SELECT * INTO v_balance 
        FROM public.user_credit_balances 
        WHERE user_id = p_user_id;
    END IF;
    
    -- Reset counters if needed
    IF DATE(v_balance.last_daily_reset) < CURRENT_DATE THEN
        UPDATE public.user_credit_balances 
        SET daily_credits_used = 0, 
            last_daily_reset = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    IF DATE_TRUNC('month', v_balance.last_monthly_reset) < DATE_TRUNC('month', NOW()) THEN
        UPDATE public.user_credit_balances 
        SET monthly_credits_used = 0, 
            last_monthly_reset = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Refresh balance after resets
    SELECT * INTO v_balance 
    FROM public.user_credit_balances 
    WHERE user_id = p_user_id;
    
    -- Update usage counters
    UPDATE public.user_credit_balances 
    SET 
        daily_credits_used = daily_credits_used + p_credits,
        monthly_credits_used = monthly_credits_used + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id, amount, transaction_type, description, reference_id
    ) VALUES (
        p_user_id, -p_credits, p_transaction_type, p_description, p_reference_id
    );
    
    v_success := true;
    
    RETURN jsonb_build_object(
        'success', v_success,
        'credits_debited', p_credits,
        'new_daily_used', v_balance.daily_credits_used + p_credits,
        'new_monthly_used', v_balance.monthly_credits_used + p_credits
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;


ALTER FUNCTION "public"."debit_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_transaction_type" "text", "p_description" "text", "p_reference_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estimate_ai_request_cost"("p_content_length" integer, "p_operation_type" "text" DEFAULT 'flashcard_generation'::"text", "p_think_harder" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
DECLARE
    v_base_tokens INTEGER;
    v_multiplier DECIMAL(4,2) := 1.0;
    v_credits_per_usd INTEGER;
    v_cost_per_1k DECIMAL(10,6);
    v_safety_buffer DECIMAL(4,2);
    v_estimated_credits INTEGER;
BEGIN
    -- Get system configuration
    SELECT (value::text)::integer INTO v_credits_per_usd 
    FROM public.system_config WHERE key = 'credits_per_usd';
    
    SELECT (value::text)::decimal INTO v_cost_per_1k 
    FROM public.system_config WHERE key = 'cost_per_1k_tokens';
    
    SELECT (value::text)::decimal INTO v_safety_buffer 
    FROM public.system_config WHERE key = 'safety_buffer_multiplier';
    
    -- Estimate tokens based on content length (rough: 1 token = 4 characters)
    v_base_tokens := GREATEST(100, p_content_length / 4 + 200); -- +200 for system prompt
    
    -- Apply operation-specific multipliers
    CASE p_operation_type
        WHEN 'think_harder' THEN v_base_tokens := v_base_tokens * 3; -- More complex analysis
        WHEN 'content_analysis' THEN v_base_tokens := v_base_tokens * 1.5;
        ELSE v_base_tokens := v_base_tokens; -- Default for flashcard_generation
    END CASE;
    
    -- Apply "Think Harder" cost multiplier
    IF p_think_harder THEN
        SELECT (value::text)::decimal INTO v_multiplier 
        FROM public.system_config WHERE key = 'think_harder_multiplier';
    END IF;
    
    -- Calculate estimated cost in credits with safety buffer
    v_estimated_credits := CEILING(
        v_base_tokens * v_cost_per_1k / 1000 * v_credits_per_usd * v_multiplier * v_safety_buffer
    );
    
    RETURN jsonb_build_object(
        'estimated_tokens', v_base_tokens,
        'estimated_credits', v_estimated_credits,
        'cost_multiplier', v_multiplier,
        'safety_buffer_applied', v_safety_buffer,
        'base_cost_usd', ROUND(v_base_tokens * v_cost_per_1k / 1000, 6),
        'final_cost_usd', ROUND(v_base_tokens * v_cost_per_1k / 1000 * v_multiplier * v_safety_buffer, 6)
    );
END;
$$;


ALTER FUNCTION "public"."estimate_ai_request_cost"("p_content_length" integer, "p_operation_type" "text", "p_think_harder" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("card_id" "uuid", "project_id" "uuid", "due" timestamp with time zone, "state" "text", "front" "text", "back" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public, pg_catalog'
    AS $$
    SELECT 
        ss.card_id, 
        ss.project_id,
        ss.due, 
        ss.state,
        f.front,
        f.back
    FROM public.srs_states ss
    INNER JOIN public.flashcards f ON ss.card_id = f.id
    WHERE ss.user_id = p_user_id 
        AND (p_project_id IS NULL OR ss.project_id = p_project_id)
        AND ss.due <= NOW()
        AND ss.is_suspended = false
    ORDER BY ss.due ASC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_plan_limits"("p_user_id" "uuid") RETURNS TABLE("plan_name" "text", "monthly_credits" integer, "max_daily_credits" integer, "max_per_request_credits" integer, "credits_remaining" integer, "daily_credits_remaining" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.name,
        sp.credits_per_month,
        sp.max_daily_credits,
        sp.max_per_request_credits,
        GREATEST(0, sp.credits_per_month - COALESCE(ucb.monthly_credits_used, 0)) as credits_remaining,
        GREATEST(0, sp.max_daily_credits - COALESCE(ucb.daily_credits_used, 0)) as daily_credits_remaining
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN public.user_credit_balances ucb ON us.user_id = ucb.user_id
    WHERE us.user_id = p_user_id 
    AND us.status = 'active';
END;
$$;


ALTER FUNCTION "public"."get_user_plan_limits"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert profile first
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  
  -- Then insert user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_admin, FALSE) 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_user_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_user_admin"() IS 'Check if current authenticated user has admin privileges';



CREATE OR REPLACE FUNCTION "public"."manage_leech_cards"("p_user_id" "uuid", "p_leech_threshold" integer DEFAULT 8) RETURNS TABLE("card_id" "uuid", "project_id" "uuid", "lapses" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public, pg_catalog'
    AS $$
    UPDATE public.srs_states
    SET is_leech = true, 
        is_suspended = true
    WHERE user_id = p_user_id 
      AND lapses >= p_leech_threshold
    RETURNING card_id, project_id, lapses;
$$;


ALTER FUNCTION "public"."manage_leech_cards"("p_user_id" "uuid", "p_leech_threshold" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_due_cards_view"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public, pg_catalog'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.optimized_due_cards;
END;
$$;


ALTER FUNCTION "public"."refresh_due_cards_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_card_update"("p_card_id" "uuid", "p_updates" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result boolean;
BEGIN
    -- Use advisory lock to prevent concurrent modifications (64-bit)
    PERFORM pg_advisory_xact_lock(hashtext(p_card_id::text)::bigint);

    UPDATE public.flashcards 
    SET 
        front = COALESCE( (p_updates->>'front')::text, front ),
        back  = COALESCE( (p_updates->>'back')::text, back ),
        updated_at = NOW()
    WHERE id = p_card_id;

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."safe_card_update"("p_card_id" "uuid", "p_updates" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "request_id" "text" NOT NULL,
    "operation_type" "text" NOT NULL,
    "input_tokens" integer,
    "output_tokens" integer,
    "total_tokens" integer,
    "model_used" "text",
    "provider" "text" DEFAULT 'deepseek'::"text",
    "estimated_cost_credits" integer NOT NULL,
    "actual_cost_credits" integer,
    "cost_multiplier" numeric(4,2) DEFAULT 1.0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "content_hash" "text",
    "output_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "ai_usage_log_actual_cost_credits_check" CHECK (("actual_cost_credits" >= 0)),
    CONSTRAINT "ai_usage_log_estimated_cost_credits_check" CHECK (("estimated_cost_credits" >= 0)),
    CONSTRAINT "ai_usage_log_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['flashcard_generation'::"text", 'content_analysis'::"text", 'think_harder'::"text"]))),
    CONSTRAINT "ai_usage_log_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "ai_usage_log_tokens_consistent" CHECK ((("total_tokens" IS NULL) OR ("total_tokens" = (COALESCE("input_tokens", 0) + COALESCE("output_tokens", 0)))))
);


ALTER TABLE "public"."ai_usage_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_usage_log" IS 'Detailed logging of AI API usage for cost tracking and debugging';



CREATE TABLE IF NOT EXISTS "public"."app_notification_reads" (
    "user_id" "uuid" NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_notification_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "published" boolean DEFAULT true
);


ALTER TABLE "public"."app_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "transaction_type" "text" NOT NULL,
    "description" "text",
    "reference_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['subscription_grant'::"text", 'manual_grant'::"text", 'ai_usage'::"text", 'refund'::"text", 'bonus'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_transactions" IS 'Audit trail of all credit additions and deductions';



CREATE TABLE IF NOT EXISTS "public"."daily_study_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "study_date" "date" NOT NULL,
    "new_cards_studied" integer DEFAULT 0 NOT NULL,
    "reviews_completed" integer DEFAULT 0 NOT NULL,
    "time_spent_seconds" integer DEFAULT 0 NOT NULL,
    "cards_learned" integer DEFAULT 0 NOT NULL,
    "cards_lapsed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid",
    CONSTRAINT "daily_study_stats_cards_lapsed_check" CHECK (("cards_lapsed" >= 0)),
    CONSTRAINT "daily_study_stats_cards_learned_check" CHECK (("cards_learned" >= 0)),
    CONSTRAINT "daily_study_stats_new_cards_studied_check" CHECK (("new_cards_studied" >= 0)),
    CONSTRAINT "daily_study_stats_project_or_global" CHECK ((("project_id" IS NOT NULL) OR ("project_id" IS NULL))),
    CONSTRAINT "daily_study_stats_reviews_completed_check" CHECK (("reviews_completed" >= 0)),
    CONSTRAINT "daily_study_stats_time_spent_seconds_check" CHECK (("time_spent_seconds" >= 0))
);


ALTER TABLE "public"."daily_study_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_study_stats" IS 'Daily study statistics and progress tracking for SRS system';



COMMENT ON COLUMN "public"."daily_study_stats"."user_id" IS 'Foreign key to auth.users table';



COMMENT ON COLUMN "public"."daily_study_stats"."study_date" IS 'Date of study session (YYYY-MM-DD)';



COMMENT ON COLUMN "public"."daily_study_stats"."new_cards_studied" IS 'Number of new cards introduced today';



COMMENT ON COLUMN "public"."daily_study_stats"."reviews_completed" IS 'Number of review cards completed today';



COMMENT ON COLUMN "public"."daily_study_stats"."time_spent_seconds" IS 'Total time spent studying in seconds';



COMMENT ON COLUMN "public"."daily_study_stats"."cards_learned" IS 'Number of cards that graduated from learning today';



COMMENT ON COLUMN "public"."daily_study_stats"."cards_lapsed" IS 'Number of cards that failed and entered relearning today';



COMMENT ON COLUMN "public"."daily_study_stats"."project_id" IS 'Project ID for per-project stats tracking. NULL for legacy global stats.';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "new_cards_per_day" integer DEFAULT 20 NOT NULL,
    "max_reviews_per_day" integer DEFAULT 100 NOT NULL,
    CONSTRAINT "projects_max_reviews_per_day_check" CHECK (("max_reviews_per_day" >= 0)),
    CONSTRAINT "projects_new_cards_per_day_check" CHECK (("new_cards_per_day" >= 0))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."new_cards_per_day" IS 'Maximum number of new cards to introduce per day for this project';



COMMENT ON COLUMN "public"."projects"."max_reviews_per_day" IS 'Maximum number of review cards to show per day for this project';



CREATE TABLE IF NOT EXISTS "public"."srs_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "interval" integer NOT NULL,
    "ease" double precision NOT NULL,
    "due" timestamp with time zone NOT NULL,
    "last_reviewed" timestamp with time zone NOT NULL,
    "repetitions" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "state" "text" DEFAULT 'new'::"text" NOT NULL,
    "lapses" integer DEFAULT 0 NOT NULL,
    "learning_step" integer DEFAULT 0 NOT NULL,
    "is_leech" boolean DEFAULT false NOT NULL,
    "is_suspended" boolean DEFAULT false NOT NULL,
    "note_id" "text",
    "template_id" "text",
    "tags" "text"[],
    CONSTRAINT "srs_states_ease_bounds" CHECK ((("ease" >= (1.0)::double precision) AND ("ease" <= (5.0)::double precision))),
    CONSTRAINT "srs_states_interval_positive" CHECK (("interval" > 0)),
    CONSTRAINT "srs_states_repetitions_non_negative" CHECK (("repetitions" >= 0)),
    CONSTRAINT "srs_states_state_check" CHECK (("state" = ANY (ARRAY['new'::"text", 'learning'::"text", 'review'::"text", 'relearning'::"text"])))
);


ALTER TABLE "public"."srs_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."srs_states" IS 'Stores spaced repetition system state for flashcards';



COMMENT ON COLUMN "public"."srs_states"."interval" IS 'Interval in days (for review cards) or minutes (for learning cards)';



COMMENT ON COLUMN "public"."srs_states"."ease" IS 'Ease factor for SM-2 algorithm (typically 1.3 to 3.0)';



COMMENT ON COLUMN "public"."srs_states"."due" IS 'When this card is next due for review';



COMMENT ON COLUMN "public"."srs_states"."repetitions" IS 'Number of successful reviews for this card';



COMMENT ON COLUMN "public"."srs_states"."state" IS 'Current state of the card: new, learning, review, or relearning';



COMMENT ON COLUMN "public"."srs_states"."lapses" IS 'Number of times this card has been forgotten during review';



COMMENT ON COLUMN "public"."srs_states"."learning_step" IS 'Current step in the learning/relearning process';



COMMENT ON COLUMN "public"."srs_states"."is_leech" IS 'Whether this card is marked as a leech (too many lapses)';



COMMENT ON COLUMN "public"."srs_states"."is_suspended" IS 'Whether this card is manually suspended from study';



COMMENT ON COLUMN "public"."srs_states"."note_id" IS 'ID of the parent note (for sibling burying)';



COMMENT ON COLUMN "public"."srs_states"."template_id" IS 'Template used to generate this card';



COMMENT ON COLUMN "public"."srs_states"."tags" IS 'Tags associated with the card';



CREATE OR REPLACE VIEW "public"."due_cards" WITH ("security_invoker"='on') AS
 SELECT "ss"."id",
    "ss"."user_id",
    "ss"."project_id",
    "ss"."card_id",
    "ss"."interval",
    "ss"."ease",
    "ss"."due",
    "ss"."last_reviewed",
    "ss"."repetitions",
    "ss"."created_at",
    "ss"."updated_at",
    "ss"."state",
    "ss"."lapses",
    "ss"."learning_step",
    "ss"."is_leech",
    "p"."name" AS "project_name"
   FROM ("public"."srs_states" "ss"
     JOIN "public"."projects" "p" ON (("ss"."project_id" = "p"."id")))
  WHERE ("ss"."due" <= "now"())
  ORDER BY "ss"."due";


ALTER VIEW "public"."due_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "extra" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "flashcards_back_not_empty" CHECK (("length"(TRIM(BOTH FROM "back")) > 0)),
    CONSTRAINT "flashcards_front_not_empty" CHECK (("length"(TRIM(BOTH FROM "front")) > 0))
);


ALTER TABLE "public"."flashcards" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."optimized_due_cards" AS
 SELECT "ss"."id",
    "ss"."user_id",
    "ss"."project_id",
    "ss"."card_id",
    "ss"."interval",
    "ss"."ease",
    "ss"."due",
    "ss"."state",
    "p"."name" AS "project_name",
    "f"."front" AS "card_front"
   FROM (("public"."srs_states" "ss"
     JOIN "public"."projects" "p" ON (("ss"."project_id" = "p"."id")))
     JOIN "public"."flashcards" "f" ON (("ss"."card_id" = "f"."id")))
  WHERE ("ss"."due" <= "now"())
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."optimized_due_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL,
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."is_admin" IS 'Admin flag - can only be updated via Supabase dashboard by project owner';



CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2) NOT NULL,
    "credits_per_month" integer NOT NULL,
    "max_daily_credits" integer NOT NULL,
    "max_per_request_credits" integer NOT NULL,
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_plans_credits_per_month_check" CHECK (("credits_per_month" >= 0)),
    CONSTRAINT "subscription_plans_max_daily_credits_check" CHECK (("max_daily_credits" >= 0)),
    CONSTRAINT "subscription_plans_max_per_request_credits_check" CHECK (("max_per_request_credits" >= 0)),
    CONSTRAINT "subscription_plans_price_monthly_check" CHECK (("price_monthly" >= (0)::numeric))
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_plans" IS 'Available subscription plans with credit limits';



CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_config" IS 'System-wide configuration for cost limits and kill switches';



CREATE TABLE IF NOT EXISTS "public"."user_credit_balances" (
    "user_id" "uuid" NOT NULL,
    "total_credits" integer DEFAULT 0 NOT NULL,
    "monthly_credits_used" integer DEFAULT 0 NOT NULL,
    "daily_credits_used" integer DEFAULT 0 NOT NULL,
    "last_monthly_reset" timestamp with time zone DEFAULT "now"(),
    "last_daily_reset" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_credit_balances_daily_credits_used_check" CHECK (("daily_credits_used" >= 0)),
    CONSTRAINT "user_credit_balances_monthly_credits_used_check" CHECK (("monthly_credits_used" >= 0)),
    CONSTRAINT "user_credit_balances_total_credits_check" CHECK (("total_credits" >= 0))
);


ALTER TABLE "public"."user_credit_balances" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_credit_balances" IS 'Real-time credit usage tracking with daily/monthly limits';



CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "url" "text",
    "read" boolean DEFAULT false,
    "trigger_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "daily_reminder" boolean DEFAULT true NOT NULL,
    "reminder_time" time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    "new_cards_per_day" integer DEFAULT 20 NOT NULL,
    "max_reviews_per_day" integer DEFAULT 100 NOT NULL,
    "learning_steps" integer[] DEFAULT ARRAY[1, 10, 1440] NOT NULL,
    "relearning_steps" integer[] DEFAULT ARRAY[10, 1440] NOT NULL,
    "graduating_interval" integer DEFAULT 1 NOT NULL,
    "easy_interval" integer DEFAULT 4 NOT NULL,
    "starting_ease" double precision DEFAULT 2.5 NOT NULL,
    "minimum_ease" double precision DEFAULT 1.3 NOT NULL,
    "easy_bonus" double precision DEFAULT 1.3 NOT NULL,
    "hard_interval_factor" double precision DEFAULT 1.2 NOT NULL,
    "easy_interval_factor" double precision DEFAULT 1.3 NOT NULL,
    "lapse_recovery_factor" double precision DEFAULT 0.2 NOT NULL,
    "leech_threshold" integer DEFAULT 8 NOT NULL,
    "leech_action" "text" DEFAULT 'suspend'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "new_card_order" "text" DEFAULT 'random'::"text" NOT NULL,
    "review_ahead" boolean DEFAULT false NOT NULL,
    "bury_siblings" boolean DEFAULT false NOT NULL,
    "max_interval" integer DEFAULT 36500 NOT NULL,
    "lapse_ease_penalty" double precision DEFAULT 0.2 NOT NULL,
    CONSTRAINT "user_settings_easy_bonus_check" CHECK ((("easy_bonus" >= (1.0)::double precision) AND ("easy_bonus" <= (2.0)::double precision))),
    CONSTRAINT "user_settings_easy_interval_check" CHECK (("easy_interval" >= 1)),
    CONSTRAINT "user_settings_easy_interval_factor_check" CHECK ((("easy_interval_factor" >= (1.0)::double precision) AND ("easy_interval_factor" <= (2.0)::double precision))),
    CONSTRAINT "user_settings_graduating_interval_check" CHECK (("graduating_interval" >= 1)),
    CONSTRAINT "user_settings_hard_interval_factor_check" CHECK ((("hard_interval_factor" >= (0.1)::double precision) AND ("hard_interval_factor" <= (2.0)::double precision))),
    CONSTRAINT "user_settings_lapse_ease_penalty_check" CHECK ((("lapse_ease_penalty" >= (0.1)::double precision) AND ("lapse_ease_penalty" <= (1.0)::double precision))),
    CONSTRAINT "user_settings_lapse_recovery_factor_check" CHECK ((("lapse_recovery_factor" >= (0.1)::double precision) AND ("lapse_recovery_factor" <= (1.0)::double precision))),
    CONSTRAINT "user_settings_leech_action_check" CHECK (("leech_action" = ANY (ARRAY['suspend'::"text", 'tag'::"text"]))),
    CONSTRAINT "user_settings_leech_threshold_check" CHECK ((("leech_threshold" >= 1) AND ("leech_threshold" <= 20))),
    CONSTRAINT "user_settings_max_interval_check" CHECK ((("max_interval" >= 1) AND ("max_interval" <= 36500))),
    CONSTRAINT "user_settings_max_reviews_per_day_check" CHECK (("max_reviews_per_day" >= 0)),
    CONSTRAINT "user_settings_minimum_ease_check" CHECK ((("minimum_ease" >= (1.0)::double precision) AND ("minimum_ease" <= (3.0)::double precision))),
    CONSTRAINT "user_settings_new_card_order_check" CHECK (("new_card_order" = ANY (ARRAY['random'::"text", 'fifo'::"text"]))),
    CONSTRAINT "user_settings_new_cards_per_day_check" CHECK (("new_cards_per_day" >= 0)),
    CONSTRAINT "user_settings_starting_ease_check" CHECK ((("starting_ease" >= (1.3)::double precision) AND ("starting_ease" <= (5.0)::double precision))),
    CONSTRAINT "user_settings_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'User preferences and SRS configuration settings';



COMMENT ON COLUMN "public"."user_settings"."learning_steps" IS 'Array of learning steps in minutes (e.g., [1, 10, 1440])';



COMMENT ON COLUMN "public"."user_settings"."relearning_steps" IS 'Array of relearning steps in minutes for lapsed cards';



COMMENT ON COLUMN "public"."user_settings"."graduating_interval" IS 'Days until first review after learning';



COMMENT ON COLUMN "public"."user_settings"."easy_interval" IS 'Days until review when marked as Easy during learning';



COMMENT ON COLUMN "public"."user_settings"."starting_ease" IS 'Initial ease factor for new cards (SM-2 algorithm)';



COMMENT ON COLUMN "public"."user_settings"."minimum_ease" IS 'Minimum allowed ease factor';



COMMENT ON COLUMN "public"."user_settings"."easy_bonus" IS 'Multiplier for Easy button on review cards';



COMMENT ON COLUMN "public"."user_settings"."hard_interval_factor" IS 'Factor for Hard button interval calculation';



COMMENT ON COLUMN "public"."user_settings"."easy_interval_factor" IS 'Factor for Easy button interval calculation';



COMMENT ON COLUMN "public"."user_settings"."lapse_recovery_factor" IS 'Multiplier for interval recovery after relearning';



COMMENT ON COLUMN "public"."user_settings"."leech_threshold" IS 'Number of lapses before marking as leech';



COMMENT ON COLUMN "public"."user_settings"."leech_action" IS 'Action to take for leech cards: suspend or tag';



COMMENT ON COLUMN "public"."user_settings"."new_card_order" IS 'Order for new cards: random or fifo';



COMMENT ON COLUMN "public"."user_settings"."review_ahead" IS 'Allow reviewing future-due cards';



COMMENT ON COLUMN "public"."user_settings"."bury_siblings" IS 'Bury sibling cards after review';



COMMENT ON COLUMN "public"."user_settings"."max_interval" IS 'Maximum interval in days';



COMMENT ON COLUMN "public"."user_settings"."lapse_ease_penalty" IS 'Ease penalty for lapses';



CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'unpaid'::"text", 'incomplete'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_subscriptions" IS 'User subscription status and Stripe integration';



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_request_id_key" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_pkey" PRIMARY KEY ("user_id", "notification_id");



ALTER TABLE ONLY "public"."app_notifications"
    ADD CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_study_stats"
    ADD CONSTRAINT "daily_study_stats_user_project_date_unique" UNIQUE ("user_id", "project_id", "study_date");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."srs_states"
    ADD CONSTRAINT "srs_states_user_id_project_id_card_id_key" UNIQUE ("user_id", "project_id", "card_id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."user_credit_balances"
    ADD CONSTRAINT "user_credit_balances_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



CREATE UNIQUE INDEX "daily_study_stats_user_global_date_unique" ON "public"."daily_study_stats" USING "btree" ("user_id", "study_date") WHERE ("project_id" IS NULL);



CREATE INDEX "idx_ai_usage_log_project_id" ON "public"."ai_usage_log" USING "btree" ("project_id");



CREATE INDEX "idx_ai_usage_log_user_status_created" ON "public"."ai_usage_log" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "idx_app_notification_reads_notification_id" ON "public"."app_notification_reads" USING "btree" ("notification_id");



CREATE INDEX "idx_credit_transactions_user_type_created" ON "public"."credit_transactions" USING "btree" ("user_id", "transaction_type", "created_at" DESC);



CREATE INDEX "idx_daily_study_stats_project_id" ON "public"."daily_study_stats" USING "btree" ("project_id");



CREATE INDEX "idx_daily_study_stats_user_date_desc" ON "public"."daily_study_stats" USING "btree" ("user_id", "study_date" DESC);



CREATE INDEX "idx_flashcards_project_id" ON "public"."flashcards" USING "btree" ("project_id");



CREATE UNIQUE INDEX "idx_optimized_due_cards" ON "public"."optimized_due_cards" USING "btree" ("id");



CREATE INDEX "idx_projects_user_created" ON "public"."projects" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_srs_states_card_id" ON "public"."srs_states" USING "btree" ("card_id");



CREATE INDEX "idx_srs_states_project_id" ON "public"."srs_states" USING "btree" ("project_id");



CREATE INDEX "idx_srs_states_user_due_suspended" ON "public"."srs_states" USING "btree" ("user_id", "due", "is_suspended") WHERE ("is_suspended" = false);



CREATE INDEX "idx_srs_states_user_project_state_due" ON "public"."srs_states" USING "btree" ("user_id", "project_id", "state", "due");



CREATE INDEX "idx_system_config_updated_by" ON "public"."system_config" USING "btree" ("updated_by");



CREATE INDEX "idx_user_notifications_user_id" ON "public"."user_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_plan_id" ON "public"."user_subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_user_subscriptions_user_active" ON "public"."user_subscriptions" USING "btree" ("user_id", "status", "current_period_end") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "user_subscriptions_active_unique" ON "public"."user_subscriptions" USING "btree" ("user_id") WHERE ("status" = 'active'::"text");



CREATE OR REPLACE TRIGGER "create_srs_state_trigger" AFTER INSERT ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."create_srs_state_for_flashcard"();



COMMENT ON TRIGGER "create_srs_state_trigger" ON "public"."flashcards" IS 'Automatically creates an SRS state record when a new flashcard is inserted';



CREATE OR REPLACE TRIGGER "update_daily_study_stats_updated_at" BEFORE UPDATE ON "public"."daily_study_stats" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_srs_states_updated_at" BEFORE UPDATE ON "public"."srs_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_credit_balances_updated_at" BEFORE UPDATE ON "public"."user_credit_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."app_notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_notification_reads"
    ADD CONSTRAINT "app_notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_credit_balances"
    ADD CONSTRAINT "user_credit_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."ai_usage_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_log_policy" ON "public"."ai_usage_log" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_notification_reads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notification_reads_policy" ON "public"."app_notification_reads" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_notifications_admin" ON "public"."app_notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "app_notifications_select" ON "public"."app_notifications" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_transactions_policy" ON "public"."credit_transactions" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."daily_study_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_study_stats_policy" ON "public"."daily_study_stats" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."flashcards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "flashcards_policy" ON "public"."flashcards" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_policy" ON "public"."profiles" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND
CASE
    WHEN (( SELECT "auth"."role"() AS "role") = 'service_role'::"text") THEN true
    ELSE ("is_admin" = COALESCE(( SELECT "profiles_1"."is_admin"
       FROM "public"."profiles" "profiles_1"
      WHERE ("profiles_1"."id" = ( SELECT "auth"."uid"() AS "uid"))), false))
END));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_policy" ON "public"."projects" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."srs_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "srs_states_policy" ON "public"."srs_states" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_plans_read" ON "public"."subscription_plans" FOR SELECT USING (("active" = true));



ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_config_admin_policy" ON "public"."system_config" USING ("public"."is_user_admin"());



ALTER TABLE "public"."user_credit_balances" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_credit_balances_policy" ON "public"."user_credit_balances" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_notifications_policy" ON "public"."user_notifications" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_policy" ON "public"."user_settings" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_subscriptions_policy" ON "public"."user_subscriptions" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."can_user_make_request"("p_user_id" "uuid", "p_estimated_credits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_make_request"("p_user_id" "uuid", "p_estimated_credits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_make_request"("p_user_id" "uuid", "p_estimated_credits" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_default_user_settings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_flashcard_with_srs_state"("p_project_id" "uuid", "p_user_id" "uuid", "p_front" "text", "p_back" "text", "p_extra" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_missing_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_missing_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_missing_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_srs_state_for_flashcard"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_srs_state_for_flashcard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_srs_state_for_flashcard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_credit_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_credit_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_credit_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debit_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_transaction_type" "text", "p_description" "text", "p_reference_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."debit_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_transaction_type" "text", "p_description" "text", "p_reference_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."debit_user_credits"("p_user_id" "uuid", "p_credits" integer, "p_transaction_type" "text", "p_description" "text", "p_reference_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."estimate_ai_request_cost"("p_content_length" integer, "p_operation_type" "text", "p_think_harder" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."estimate_ai_request_cost"("p_content_length" integer, "p_operation_type" "text", "p_think_harder" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."estimate_ai_request_cost"("p_content_length" integer, "p_operation_type" "text", "p_think_harder" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_cards"("p_user_id" "uuid", "p_project_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_plan_limits"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_plan_limits"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_plan_limits"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";



GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_leech_cards"("p_user_id" "uuid", "p_leech_threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_leech_cards"("p_user_id" "uuid", "p_leech_threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_due_cards_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_due_cards_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_due_cards_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_card_update"("p_card_id" "uuid", "p_updates" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_card_update"("p_card_id" "uuid", "p_updates" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "service_role";



GRANT ALL ON TABLE "public"."app_notification_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notification_reads" TO "service_role";



GRANT ALL ON TABLE "public"."app_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."app_notifications" TO "anon";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_study_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_study_stats" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."srs_states" TO "authenticated";
GRANT ALL ON TABLE "public"."srs_states" TO "service_role";



GRANT ALL ON TABLE "public"."due_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."due_cards" TO "service_role";



GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."optimized_due_cards" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."user_credit_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_credit_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credit_balances" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
