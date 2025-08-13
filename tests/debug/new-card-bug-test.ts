#!/usr/bin/env tsx
/**
 * Comprehensive test to diagnose why newly created flashcards don't appear as new cards in study queue
 * 
 * This test will:
 * 1. Create a test project
 * 2. Create a new flashcard
 * 3. Verify SRS state creation in database
 * 4. Verify SRS state loading from database
 * 5. Verify study logic recognizes the card
 * 6. Test end-to-end study flow
 */

import { createClient } from '@/lib/supabase/server';
import { createFlashcard } from '@/app/(main)/projects/actions/flashcard-actions';
import { loadSRSStates } from '@/lib/srs/SRSDBUtils';
import { getNextCardToStudyWithSettings, getSessionAwareStudyStats } from '@/lib/srs/SRSSession';
import { DEFAULT_SRS_SETTINGS } from '@/lib/srs/SRSScheduler';

async function debugNewCardBug() {
  console.log('🐛 Starting new card bug diagnostic test...\n');

  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Not authenticated:', userError);
    return;
  }

  console.log(`✅ Authenticated as user: ${user.id}\n`);

  // Step 1: Create a test project
  console.log('📁 Step 1: Creating test project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      user_id: user.id,
      name: 'New Card Bug Test Project',
      description: 'Test project for debugging new card issue'
    }])
    .select('*')
    .single();

  if (projectError || !project) {
    console.error('❌ Failed to create test project:', projectError);
    return;
  }

  console.log(`✅ Created test project: ${project.id}\n`);

  try {
    // Step 2: Create a new flashcard
    console.log('📚 Step 2: Creating new flashcard...');
    const flashcard = await createFlashcard(project.id, {
      front: 'Test Question: What is 2+2?',
      back: 'Test Answer: 4',
      extra: {}
    });

    if (!flashcard) {
      console.error('❌ Failed to create flashcard');
      return;
    }

    console.log(`✅ Created flashcard: ${flashcard.id}`);
    console.log(`   Front: ${flashcard.front}`);
    console.log(`   Back: ${flashcard.back}\n`);

    // Step 3: Verify SRS state creation in database
    console.log('🔍 Step 3: Verifying SRS state in database...');
    const { data: srsStates, error: srsError } = await supabase
      .from('srs_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', project.id)
      .eq('card_id', flashcard.id);

    if (srsError) {
      console.error('❌ Error fetching SRS states:', srsError);
      return;
    }

    if (!srsStates || srsStates.length === 0) {
      console.error('❌ No SRS state found in database for new flashcard!');
      console.log('   This is the root cause of the bug!');
      return;
    }

    const srsState = srsStates[0];
    console.log(`✅ Found SRS state in database:`);
    console.log(`   ID: ${srsState.id}`);
    console.log(`   State: ${srsState.state}`);
    console.log(`   Due: ${new Date(srsState.due).toISOString()}`);
    console.log(`   Interval: ${srsState.interval}`);
    console.log(`   Ease: ${srsState.ease}`);
    console.log(`   Last Reviewed: ${new Date(srsState.last_reviewed).toISOString()}\n`);

    // Verify the state is correct for a new card
    if (srsState.state !== 'new') {
      console.error(`❌ SRS state should be 'new' but is '${srsState.state}'`);
      return;
    }

    const now = Date.now();
    const dueTime = new Date(srsState.due).getTime();
    if (dueTime > now) {
      console.error(`❌ New card due time is in the future! Due: ${new Date(srsState.due).toISOString()}, Now: ${new Date(now).toISOString()}`);
      return;
    }

    console.log(`✅ SRS state looks correct for a new card\n`);

    // Step 4: Verify SRS state loading from database
    console.log('📥 Step 4: Testing SRS state loading...');
    const loadedStates = await loadSRSStates(supabase, user.id, project.id, [flashcard.id]);

    if (!loadedStates[flashcard.id]) {
      console.error('❌ Failed to load SRS state using loadSRSStates function');
      return;
    }

    const loadedState = loadedStates[flashcard.id];
    console.log(`✅ Successfully loaded SRS state:`);
    console.log(`   ID: ${loadedState.id}`);
    console.log(`   State: ${loadedState.state}`);
    console.log(`   Due: ${new Date(loadedState.due).toISOString()}`);
    console.log(`   Is due now: ${loadedState.due <= now}\n`);

    // Step 5: Test study session logic
    console.log('🎯 Step 5: Testing study session logic...');
    
    // Create a mock study session (new session)
    const studySession = {
      newCardsStudied: 0,
      reviewsCompleted: 0,
      learningCardsInQueue: [],
      reviewHistory: [],
      buriedCards: new Set(),
      _incrementalCounters: {
        newCardsFromHistory: 0,
        reviewsFromHistory: 0,
        lastHistoryLength: 0,
      },
    };

    // Test card selection
    const nextCardId = getNextCardToStudyWithSettings(
      loadedStates,
      studySession,
      DEFAULT_SRS_SETTINGS,
      now
    );

    if (nextCardId !== flashcard.id) {
      console.error(`❌ Study logic didn't select our new card!`);
      console.log(`   Expected: ${flashcard.id}`);
      console.log(`   Got: ${nextCardId}`);
      
      // Debug: show what cards are available
      console.log(`   Available cards in loaded states:`, Object.keys(loadedStates));
      Object.values(loadedStates).forEach(card => {
        console.log(`   Card ${card.id}: state=${card.state}, due=${new Date(card.due).toISOString()}, isDue=${card.due <= now}`);
      });
      return;
    }

    console.log(`✅ Study logic correctly selected the new card: ${nextCardId}\n`);

    // Step 6: Test study statistics
    console.log('📊 Step 6: Testing study statistics...');
    const stats = getSessionAwareStudyStats(loadedStates, studySession, DEFAULT_SRS_SETTINGS, now);
    
    console.log(`Study statistics:`);
    console.log(`   Available new cards: ${stats.availableNewCards}`);
    console.log(`   Due learning cards: ${stats.dueLearningCards}`);
    console.log(`   Due review cards: ${stats.dueReviewCards}`);
    console.log(`   Total due cards: ${stats.dueCards}`);

    if (stats.availableNewCards === 0) {
      console.error(`❌ Statistics show 0 available new cards, but we should have 1!`);
      return;
    }

    if (stats.dueCards === 0) {
      console.error(`❌ Statistics show 0 due cards, but we should have 1!`);
      return;
    }

    console.log(`✅ Study statistics look correct\n`);

    // Step 7: End-to-end test summary
    console.log('🎉 Step 7: End-to-end test summary');
    console.log('✅ All steps passed! The new card bug might be elsewhere:');
    console.log('   ✅ Flashcard created successfully');
    console.log('   ✅ SRS state created in database');
    console.log('   ✅ SRS state loaded correctly');
    console.log('   ✅ Study logic selects the new card');
    console.log('   ✅ Statistics show available cards');
    console.log('');
    console.log('🔍 Possible issues to investigate:');
    console.log('   - Cache invalidation after flashcard creation');
    console.log('   - Race conditions in the UI');
    console.log('   - Different user context between creation and study');
    console.log('   - BatchAPI interfering with real-time updates');

  } finally {
    // Cleanup: Delete the test project
    console.log('\n🧹 Cleaning up test project...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (deleteError) {
      console.error('❌ Failed to cleanup test project:', deleteError);
    } else {
      console.log('✅ Test project cleaned up');
    }
  }
}

// Run the test
debugNewCardBug().catch(console.error);