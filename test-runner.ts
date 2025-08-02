// Simple test runner for the SRS algorithm
// This imports the actual TypeScript functions and tests them

import { testAnkiAlgorithmCompatibility, testMinimumEaseBoundary } from '../app/(main)/projects/components/SRSTest';

console.log("Running SRS Algorithm Tests...");

const algorithmPassed = testAnkiAlgorithmCompatibility();
const boundaryPassed = testMinimumEaseBoundary();

console.log("\n=== FINAL RESULTS ===");
console.log(`Algorithm Compatibility: ${algorithmPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Boundary Tests: ${boundaryPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Overall: ${algorithmPassed && boundaryPassed ? '🎉 ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);