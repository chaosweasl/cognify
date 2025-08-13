#!/usr/bin/env tsx
/**
 * Test the exact reproduction scenario:
 * 1. User creates flashcards in a project
 * 2. User navigates to study page
 * 3. Check if new cards appear in study queue
 * 
 * This simulates the real user workflow to reproduce the bug.
 */

import { createClient } from '@/lib/supabase/server';
import { createFlashcards } from '@/app/(main)/projects/actions/flashcard-actions';
import { getFlashcardsByProjectId } from '@/app/(main)/projects/actions/flashcard-actions';
import { loadSRSStates } from '@/lib/srs/SRSDBUtils';
import { getNextCardToStudyWithSettings, getSessionAwareStudyStats } from '@/lib/srs/SRSSession';
import { DEFAULT_SRS_SETTINGS } from '@/lib/srs/SRSScheduler';
import { getDailyStudyStats } from '@/lib/supabase/dailyStudyStats';

async function reproduceNewCardBug() {
  console.log('🔬 Reproducing the exact new card bug scenario...\n');

  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Authentication required. Please run this with proper auth context.');
    return;
  }

  console.log(`✅ User authenticated: ${user.id}\n`);

  // Create a test project
  console.log('📁 Creating test project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      user_id: user.id,
      name: 'Bug Reproduction Test',
      description: 'Testing new card bug reproduction'
    }])
    .select('*')
    .single();

  if (projectError || !project) {
    console.error('❌ Failed to create project:', projectError);
    return;
  }

  console.log(`✅ Created project: ${project.id} - ${project.name}\n`);

  try {
    // Step 1: Create multiple flashcards (like a user would)
    console.log('📚 Step 1: Creating flashcards...');
    const flashcardsData = [
      { front: 'What is the capital of France?', back: 'Paris', extra: {} },
      { front: 'What is 2 + 2?', back: '4', extra: {} },
      { front: 'What color is the sky?', back: 'Blue', extra: {} },
    ];

    const createdFlashcards = await createFlashcards(project.id, flashcardsData);
    console.log(`✅ Created ${createdFlashcards.length} flashcards`);
    createdFlashcards.forEach((card, i) => {
      console.log(`   ${i + 1}. ${card.id}: ${card.front}`);
    });
    console.log('');

    // Step 2: Simulate what happens when user navigates to study page
    console.log('🎯 Step 2: Simulating study page load...');
    
    // Load flashcards (as the study page does)
    const flashcards = await getFlashcardsByProjectId(project.id);
    console.log(`✅ Loaded ${flashcards.length} flashcards from database`);

    if (flashcards.length === 0) {
      console.error('❌ No flashcards loaded! This should not happen.');
      return;
    }

    // Load SRS states (as the study page does)
    const cardIds = flashcards.map(card => card.id);
    const existingSRSStates = await loadSRSStates(supabase, user.id, project.id, cardIds);
    console.log(`✅ Loaded SRS states for ${Object.keys(existingSRSStates).length} cards`);

    // Debug: Show state of each card
    console.log('\n📋 Current SRS states:');
    Object.values(existingSRSStates).forEach((state, i) => {
      const isNew = state.state === 'new';
      const isDue = state.due <= Date.now();
      console.log(`   ${i + 1}. Card ${state.id.slice(0, 8)}: state=${state.state}, due=${isDue ? 'YES' : 'NO'} (${new Date(state.due).toLocaleTimeString()})`);
    });
    console.log('');

    // Step 3: Check daily stats (as study page does)
    console.log('📊 Step 3: Checking daily study stats...');
    const dailyStats = await getDailyStudyStats(user.id);
    console.log(`Daily stats: new=${dailyStats.newCardsStudied}, reviews=${dailyStats.reviewsCompleted}`);

    // Step 4: Simulate study session initialization
    console.log('\n🎮 Step 4: Simulating study session...');
    const studySession = {
      newCardsStudied: dailyStats.newCardsStudied,
      reviewsCompleted: dailyStats.reviewsCompleted,
      learningCardsInQueue: [],
      reviewHistory: [],
      buriedCards: new Set(),
      _incrementalCounters: {
        newCardsFromHistory: dailyStats.newCardsStudied,
        reviewsFromHistory: dailyStats.reviewsCompleted,
        lastHistoryLength: 0,
      },
    };

    // Step 5: Get study statistics (as displayed in UI)
    const now = Date.now();
    const stats = getSessionAwareStudyStats(existingSRSStates, studySession, DEFAULT_SRS_SETTINGS, now);
    
    console.log('📈 Study statistics that would be shown to user:');
    console.log(`   Available new cards: ${stats.availableNewCards}`);
    console.log(`   Due learning cards: ${stats.dueLearningCards}`);
    console.log(`   Due review cards: ${stats.dueReviewCards}`);
    console.log(`   Total due cards: ${stats.dueCards}`);
    console.log('');

    // Step 6: Try to get next card to study
    const nextCardId = getNextCardToStudyWithSettings(
      existingSRSStates,
      studySession,
      DEFAULT_SRS_SETTINGS,
      now
    );

    console.log('🎯 Next card selection result:');
    if (nextCardId) {
      const nextCard = flashcards.find(c => c.id === nextCardId);
      console.log(`✅ Next card selected: ${nextCardId}`);
      console.log(`   Front: ${nextCard?.front}`);
      console.log(`   State: ${existingSRSStates[nextCardId]?.state}`);
    } else {
      console.log('❌ No card selected for study!');
      
      // Debug: Check why no card was selected
      console.log('\n🔍 Debugging why no card was selected:');
      
      // Check new cards
      const newCards = Object.values(existingSRSStates).filter(card => card.state === 'new');
      console.log(`   New cards available: ${newCards.length}`);
      
      if (newCards.length > 0) {
        console.log(`   But daily limit check: newCardsStudied=${studySession.newCardsStudied}, limit=${DEFAULT_SRS_SETTINGS.NEW_CARDS_PER_DAY}`);
        console.log(`   Should be able to study: ${studySession.newCardsStudied < DEFAULT_SRS_SETTINGS.NEW_CARDS_PER_DAY}`);
      }

      // Check learning cards
      const learningCards = Object.values(existingSRSStates).filter(card => 
        (card.state === 'learning' || card.state === 'relearning') && card.due <= now
      );
      console.log(`   Due learning cards: ${learningCards.length}`);

      // Check review cards  
      const reviewCards = Object.values(existingSRSStates).filter(card => 
        card.state === 'review' && card.due <= now
      );
      console.log(`   Due review cards: ${reviewCards.length}`);
    }

    // Final diagnosis
    console.log('\n🏁 Reproduction Results:');
    if (nextCardId && stats.availableNewCards > 0) {
      console.log('✅ WORKING: New cards are available and can be studied');
      console.log('   The bug might be intermittent or in the UI layer');
    } else if (stats.availableNewCards === 0) {
      console.log('❌ BUG CONFIRMED: New cards should be available but stats show 0');
      console.log('   Root cause: Study statistics calculation');
    } else if (!nextCardId) {
      console.log('❌ BUG CONFIRMED: Cards available in stats but not selected for study');
      console.log('   Root cause: Card selection algorithm');
    }

  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test project...');
    await supabase.from('projects').delete().eq('id', project.id);
    console.log('✅ Cleanup complete');
  }
}

// Export for potential use in other tests
export { reproduceNewCardBug };

// Run if called directly
if (require.main === module) {
  reproduceNewCardBug().catch(console.error);
}