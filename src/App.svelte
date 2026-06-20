<script lang="ts">
// Root component. The full screen router lands in task D8.
const title = "MAGA Money Moves";
const tagline = "From Queens to the Red Planet.";
</script>

<main>
  <h1>{title}</h1>
  <p>{tagline}</p>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 100dvh;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    color: #d4af37;
    letter-spacing: 0.02em;
  }

  p {
    margin: 0;
    color: #c9c9c9;
  }
</style>
