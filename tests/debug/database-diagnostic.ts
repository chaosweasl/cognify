#!/usr/bin/env tsx
/**
 * Database-level diagnostic test for new card bug
 * 
 * This test directly checks the database for issues without relying on Next.js server components
 */

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

async function diagnoseDatabaseIssues() {
  console.log('🔍 Database-level diagnostic for new card bug...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Check for orphaned flashcards (flashcards without SRS states)
  console.log('📋 Test 1: Checking for orphaned flashcards...');
  
  const { data: orphanedFlashcards, error: orphanError } = await supabase
    .from('flashcards')
    .select(`
      id,
      project_id,
      front,
      created_at,
      projects!inner(user_id)
    `)
    .is('srs_states.card_id', null);

  if (orphanError) {
    console.error('❌ Error checking orphaned flashcards:', orphanError);
    return;
  }

  console.log(`Found ${orphanedFlashcards?.length || 0} orphaned flashcards`);
  
  if (orphanedFlashcards && orphanedFlashcards.length > 0) {
    console.log('❌ BUG FOUND: Flashcards exist without SRS states!');
    console.log('These flashcards will not appear in study queue:');
    orphanedFlashcards.slice(0, 5).forEach((card, i) => {
      console.log(`   ${i + 1}. ID: ${card.id}`);
      console.log(`      Front: ${card.front?.substring(0, 50)}...`);
      console.log(`      Created: ${card.created_at}`);
      console.log(`      Project: ${card.project_id}`);
    });
    if (orphanedFlashcards.length > 5) {
      console.log(`      ... and ${orphanedFlashcards.length - 5} more`);
    }
    console.log('');
  } else {
    console.log('✅ No orphaned flashcards found');
  }

  // Test 2: Check SRS states with invalid 'new' card settings
  console.log('🎯 Test 2: Checking SRS states for new cards...');
  
  const { data: newCardStates, error: newCardError } = await supabase
    .from('srs_states')
    .select('*')
    .eq('state', 'new');

  if (newCardError) {
    console.error('❌ Error checking new card states:', newCardError);
    return;
  }

  console.log(`Found ${newCardStates?.length || 0} cards in 'new' state`);

  if (newCardStates && newCardStates.length > 0) {
    // Check for issues with new cards
    const now = new Date();
    let issuesFound = 0;

    console.log('Analyzing new card states:');
    newCardStates.slice(0, 5).forEach((state, i) => {
      const dueDate = new Date(state.due);
      const isDueInFuture = dueDate > now;
      const hasInvalidInterval = state.interval <= 0;
      const hasInvalidEase = state.ease < 1.0 || state.ease > 5.0;

      console.log(`   ${i + 1}. Card ${state.card_id.substring(0, 8)}:`);
      console.log(`      State: ${state.state}`);
      console.log(`      Due: ${dueDate.toISOString()} (${isDueInFuture ? 'FUTURE' : 'PAST/NOW'})`);
      console.log(`      Interval: ${state.interval} (${hasInvalidInterval ? 'INVALID' : 'OK'})`);
      console.log(`      Ease: ${state.ease} (${hasInvalidEase ? 'INVALID' : 'OK'})`);

      if (isDueInFuture || hasInvalidInterval || hasInvalidEase) {
        issuesFound++;
        console.log(`      ❌ ISSUES DETECTED`);
      } else {
        console.log(`      ✅ Looks OK`);
      }
    });

    if (issuesFound > 0) {
      console.log(`❌ Found ${issuesFound} new cards with configuration issues`);
    } else {
      console.log(`✅ All sampled new cards have correct configuration`);
    }
  }

  // Test 3: Check recent flashcards and their SRS states
  console.log('\n⏰ Test 3: Checking recently created flashcards...');
  
  const { data: recentFlashcards, error: recentError } = await supabase
    .from('flashcards')
    .select(`
      id,
      front,
      created_at,
      project_id,
      srs_states!inner(
        id,
        state,
        due,
        interval,
        ease
      )
    `)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('❌ Error checking recent flashcards:', recentError);
    return;
  }

  console.log(`Found ${recentFlashcards?.length || 0} recent flashcards (last 24h)`);

  if (recentFlashcards && recentFlashcards.length > 0) {
    console.log('Recent flashcards and their SRS states:');
    recentFlashcards.forEach((card, i) => {
      console.log(`   ${i + 1}. Card: ${card.front?.substring(0, 40)}...`);
      console.log(`      Created: ${card.created_at}`);
      console.log(`      SRS State: ${card.srs_states?.state || 'MISSING'}`);
      if (card.srs_states) {
        console.log(`      Due: ${new Date(card.srs_states.due).toISOString()}`);
        console.log(`      Available now: ${new Date(card.srs_states.due) <= new Date()}`);
      }
    });
  }

  // Test 4: Summary and recommendations
  console.log('\n📊 Summary and Recommendations:');
  
  if (orphanedFlashcards && orphanedFlashcards.length > 0) {
    console.log('❌ PRIMARY ISSUE: Flashcards without SRS states detected');
    console.log('   Recommendation: Run the migration to create missing SRS states');
    console.log('   Migration file: migrations/001_fix_missing_srs_states.sql');
  } else {
    console.log('✅ No database integrity issues found');
    console.log('   The bug may be in the application logic or UI layer');
    console.log('   Possible causes:');
    console.log('   - Cache invalidation issues');
    console.log('   - Race conditions in flashcard creation');
    console.log('   - Study session state management');
    console.log('   - UI refresh timing');
  }
}

// Run the diagnostic
diagnoseDatabaseIssues().catch(console.error);