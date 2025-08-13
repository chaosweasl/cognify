-- Migration: Ensure SRS State Integrity for New Cards
-- Purpose: Fix any missing SRS states and add triggers for automatic creation
-- Date: 2024-01-01
-- 
-- This migration addresses the bug where newly created flashcards
-- don't appear as new cards in the study queue due to missing SRS states.

-- Step 1: Create missing SRS states for existing flashcards
-- This will find any flashcards that don't have corresponding SRS states
-- and create new states for them

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
)
SELECT 
    p.user_id,
    f.project_id,
    f.id as card_id,
    1 as interval,           -- Initial interval for new cards
    2.5 as ease,            -- Default ease factor
    f.created_at as due,    -- New cards are immediately available (use creation time)
    f.created_at as last_reviewed,  -- Set last reviewed to creation time
    0 as repetitions,       -- No repetitions yet
    'new' as state,         -- Mark as new card
    0 as lapses,           -- No lapses yet
    0 as learning_step,    -- Start at learning step 0
    false as is_leech,     -- Not a leech card
    false as is_suspended  -- Not suspended
FROM public.flashcards f
INNER JOIN public.projects p ON f.project_id = p.id
LEFT JOIN public.srs_states s ON s.card_id = f.id
WHERE s.card_id IS NULL;  -- Only create states for cards that don't have them

-- Step 2: Create a function to automatically create SRS states when flashcards are inserted
CREATE OR REPLACE FUNCTION public.create_srs_state_for_flashcard()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to automatically create SRS states on flashcard insertion
CREATE OR REPLACE TRIGGER create_srs_state_trigger
    AFTER INSERT ON public.flashcards
    FOR EACH ROW
    EXECUTE FUNCTION public.create_srs_state_for_flashcard();

-- Step 4: Create atomic function for flashcard creation with SRS state
CREATE OR REPLACE FUNCTION public.create_flashcard_with_srs_state(
    p_project_id UUID,
    p_user_id UUID,
    p_front TEXT,
    p_back TEXT,
    p_extra JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add comments explaining the new components
COMMENT ON TRIGGER create_srs_state_trigger ON public.flashcards IS 
'Automatically creates an SRS state record when a new flashcard is inserted';

COMMENT ON FUNCTION public.create_srs_state_for_flashcard() IS 
'Function to create initial SRS state for newly inserted flashcards';

COMMENT ON FUNCTION public.create_flashcard_with_srs_state(UUID, UUID, TEXT, TEXT, JSONB) IS 
'Atomically creates a flashcard and its SRS state with proper authorization checks';

-- Step 6: Verify the migration worked by checking for orphaned flashcards
-- This is a verification query - not executed in migration but can be run manually:
--
-- SELECT 
--     f.id as flashcard_id,
--     f.project_id,
--     p.user_id,
--     s.id as srs_state_id
-- FROM public.flashcards f
-- INNER JOIN public.projects p ON f.project_id = p.id  
-- LEFT JOIN public.srs_states s ON s.card_id = f.id
-- WHERE s.card_id IS NULL;
--
-- This should return 0 rows after the migration.