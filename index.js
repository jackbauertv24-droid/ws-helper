console.log('🚀 Placeholder app started');

async function runLongTask() {
  console.log('⏳ Long‑running task started…');
  // Simulate a task that never resolves (keep process alive)
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log('✅ Long‑running task completed');
  process.exit(0);
}

runLongTask().catch(err => {
  console.error('Unexpected error:', err);
});
