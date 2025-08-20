# Database Trigger Function Fix

The database trigger function `create_srs_state_for_flashcard` needs to be updated to use the correct column names. This is causing the error when creating flashcards:

```
Error: column "interval" of relation "srs_states" does not exist
```

## How to Fix

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hiiipwgvyavnelzksgrr
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query and paste the following SQL:

```sql
-- Fix the create_srs_state_for_flashcard function to use correct column names
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
```

4. Click **Run** to execute the query
5. The function will be updated and flashcard creation should work

## What This Fixes

- **Column Name**: Changes `interval` to `card_interval` to match the actual database schema
- **Missing Value**: Adds the missing `false` value for `is_suspended`
- **Return Statement**: Ensures proper trigger return

After this fix, the flashcard creation and study system should work properly.