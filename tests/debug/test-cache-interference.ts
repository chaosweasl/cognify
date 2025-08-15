#!/usr/bin/env tsx
/**
 * Test for cache-related issues with new flashcard creation
 * 
 * This test checks if the new development standards caching system
 * is interfering with real-time flashcard and SRS state updates.
 */

import { createClient } from '@/lib/supabase/server';
import { createFlashcard } from '@/app/(main)/projects/actions/flashcard-actions';
import { getFlashcardsByProjectId } from '@/app/(main)/projects/actions/flashcard-actions';
import { loadSRSStates } from '@/lib/srs/SRSDBUtils';

async function testCacheInterference() {
  console.log('🔄 Testing cache interference with new flashcard creation...\n');

  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Authentication required');
    return;
  }

  console.log(`✅ User: ${user.id}\n`);

  // Create test project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      user_id: user.id,
      name: 'Cache Test Project',
      description: 'Testing cache interference'
    }])
    .select('*')
    .single();

  if (projectError || !project) {
    console.error('❌ Failed to create project:', projectError);
    return;
  }

  console.log(`✅ Created project: ${project.id}\n`);

  try {
    // Test 1: Check initial state (should be empty)
    console.log('🔍 Test 1: Initial state check...');
    let flashcards1 = await getFlashcardsByProjectId(project.id);
    console.log(`Initial flashcards count: ${flashcards1.length}`);
    
    if (flashcards1.length !== 0) {
      console.error('❌ Expected 0 flashcards initially');
      return;
    }

    // Test 2: Create flashcard and immediately check
    console.log('\n📚 Test 2: Create flashcard and immediate check...');
    const flashcard = await createFlashcard(project.id, {
      front: 'Cache Test Question',
      back: 'Cache Test Answer',
      extra: {}
    });

    if (!flashcard) {
      console.error('❌ Failed to create flashcard');
      return;
    }

    console.log(`✅ Created flashcard: ${flashcard.id}`);

    // Immediately fetch flashcards again
    let flashcards2 = await getFlashcardsByProjectId(project.id);
    console.log(`Flashcards count after creation: ${flashcards2.length}`);

    if (flashcards2.length !== 1) {
      console.error('❌ Expected 1 flashcard after creation, got', flashcards2.length);
      console.log('   This suggests caching is preventing real-time updates');
      return;
    }

    // Test 3: Check SRS state creation immediately
    console.log('\n🎯 Test 3: SRS state immediate check...');
    const srsStates1 = await loadSRSStates(supabase, user.id, project.id, [flashcard.id]);
    console.log(`SRS states loaded: ${Object.keys(srsStates1).length}`);

    if (Object.keys(srsStates1).length !== 1) {
      console.error('❌ Expected 1 SRS state, got', Object.keys(srsStates1).length);
      return;
    }

    const srsState = srsStates1[flashcard.id];
    if (!srsState) {
      console.error('❌ No SRS state found for flashcard');
      return;
    }

    console.log(`✅ SRS state found:`);
    console.log(`   State: ${srsState.state}`);
    console.log(`   Due: ${new Date(srsState.due).toISOString()}`);
    console.log(`   Is new: ${srsState.state === 'new'}`);
    console.log(`   Is due: ${srsState.due <= Date.now()}`);

    // Test 4: Multiple rapid operations
    console.log('\n⚡ Test 4: Rapid operations test...');
    
    // Create multiple flashcards rapidly
    const flashcard2 = await createFlashcard(project.id, {
      front: 'Rapid Test 1',
      back: 'Answer 1',
      extra: {}
    });

    const flashcard3 = await createFlashcard(project.id, {
      front: 'Rapid Test 2', 
      back: 'Answer 2',
      extra: {}
    });

    if (!flashcard2 || !flashcard3) {
      console.error('❌ Failed to create rapid flashcards');
      return;
    }

    // Immediately check count
    let flashcards3 = await getFlashcardsByProjectId(project.id);
    console.log(`Flashcards after rapid creation: ${flashcards3.length}`);

    if (flashcards3.length !== 3) {
      console.error(`❌ Expected 3 flashcards after rapid creation, got ${flashcards3.length}`);
      console.log('   This suggests race conditions or caching issues');
      
      // Check what we actually got
      console.log('   Actual flashcards:');
      flashcards3.forEach((card, i) => {
        console.log(`     ${i + 1}. ${card.id}: ${card.front}`);
      });
      return;
    }

    // Check SRS states for all cards
    const allCardIds = flashcards3.map(c => c.id);
    const allSrsStates = await loadSRSStates(supabase, user.id, project.id, allCardIds);
    console.log(`SRS states for all cards: ${Object.keys(allSrsStates).length}`);

    if (Object.keys(allSrsStates).length !== 3) {
      console.error(`❌ Expected 3 SRS states, got ${Object.keys(allSrsStates).length}`);
      return;
    }

    // Test 5: Direct database check (bypass any application caching)
    console.log('\n🔍 Test 5: Direct database verification...');
    
    const { data: dbFlashcards, error: dbError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('project_id', project.id);

    if (dbError) {
      console.error('❌ Database query error:', dbError);
      return;
    }

    console.log(`Direct DB flashcards count: ${dbFlashcards?.length || 0}`);

    const { data: dbSrsStates, error: dbSrsError } = await supabase
      .from('srs_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', project.id);

    if (dbSrsError) {
      console.error('❌ Database SRS query error:', dbSrsError);
      return;
    }

    console.log(`Direct DB SRS states count: ${dbSrsStates?.length || 0}`);

    // Verify all flashcards have SRS states
    const dbFlashcardIds = new Set(dbFlashcards?.map(f => f.id) || []);
    const dbSrsCardIds = new Set(dbSrsStates?.map(s => s.card_id) || []);

    console.log('\n📊 Final verification:');
    console.log(`DB Flashcards: ${dbFlashcardIds.size}`);
    console.log(`DB SRS States: ${dbSrsCardIds.size}`);
    console.log(`All flashcards have SRS states: ${dbFlashcardIds.size === dbSrsCardIds.size}`);

    // Check for missing SRS states
    const missingSrs = Array.from(dbFlashcardIds).filter(id => !dbSrsCardIds.has(id));
    if (missingSrs.length > 0) {
      console.error(`❌ Flashcards missing SRS states:`, missingSrs);
      return;
    }

    // Check for orphaned SRS states
    const orphanedSrs = Array.from(dbSrsCardIds).filter(id => !dbFlashcardIds.has(id));
    if (orphanedSrs.length > 0) {
      console.error(`❌ Orphaned SRS states:`, orphanedSrs);
      return;
    }

    console.log('✅ All cache interference tests passed!');
    console.log('   - Real-time updates work correctly');
    console.log('   - No caching interference detected');
    console.log('   - SRS states created correctly for all flashcards');

  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.from('projects').delete().eq('id', project.id);
    console.log('✅ Cleanup complete');
  }
}

// Export for use in other tests
export { testCacheInterference };

// Run if called directly
if (require.main === module) {
  testCacheInterference().catch(console.error);
}