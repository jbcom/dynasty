<script lang="ts">
// Root component. The full screen router + live game wiring lands in task D8.
// Until then this is the brand title card; components are exercised in isolation
// via Vitest browser-mode tests.
</script>

<main>
  <h1>MAGA Money Moves</h1>
  <p>From Queens to the Red Planet.</p>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 100dvh;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-size: 2.4rem;
    color: var(--mmm-gold);
    text-shadow: var(--mmm-shadow-gold);
  }
  p {
    margin: 0;
    color: var(--mmm-text-dim);
  }
</style>
