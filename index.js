console.log('🚀 Placeholder app started');

async function runLongTask() {
  console.log('⏳ Long‑running task started…');
  // Simulate a task that never resolves (keep process alive)
  await new Promise(() => {});
}

runLongTask().catch(err => {
  console.error('Unexpected error:', err);
});
