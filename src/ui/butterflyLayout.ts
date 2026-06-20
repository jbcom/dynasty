import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { LedgerEntry } from "../sim/state";

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  kind: "cause" | "effect";
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
  text: string;
}

export interface GraphLayout {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Build a cause→effect DAG from ledger entries and run a d3-force simulation to
 * a fixed number of ticks so the layout is deterministic (no animation loop,
 * no Math.random in the sim path — d3-force is UI-side and seeded by ticks only).
 */
export function layoutButterfly(
  ledger: readonly LedgerEntry[],
  width = 360,
  height = 360,
): GraphLayout {
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  for (const entry of ledger) {
    const causeId = `c:${entry.sourceChoice}`;
    const effectId = `e:${entry.ruleId ?? entry.sourceEvent}`;
    if (!nodeMap.has(causeId)) {
      nodeMap.set(causeId, { id: causeId, label: entry.sourceChoice, kind: "cause" });
    }
    if (!nodeMap.has(effectId)) {
      nodeMap.set(effectId, { id: effectId, label: entry.ruleId ?? entry.sourceEvent, kind: "effect" });
    }
    links.push({ source: causeId, target: effectId, text: entry.text });
  }

  const nodes = [...nodeMap.values()];
  if (nodes.length === 0) return { nodes, links };

  // Deterministic initial placement on a circle (avoids d3's random jitter).
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    n.x = width / 2 + Math.cos(angle) * (width / 3);
    n.y = height / 2 + Math.sin(angle) * (height / 3);
  });

  const cx = width / 2;
  const cy = height / 2;
  const sim = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(-120))
    .force("center", forceCenter(cx, cy))
    // Pull toward center so the graph stays inside the viewBox instead of drifting.
    .force("x", forceX(cx).strength(0.18))
    .force("y", forceY(cy).strength(0.18))
    .force(
      "link",
      forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(56),
    )
    .stop();

  // Run synchronously to convergence for a stable, testable layout.
  for (let i = 0; i < 300; i++) sim.tick();

  // Clamp into a padded box so labels and nodes never clip the SVG edge.
  const pad = 28;
  for (const n of nodes) {
    n.x = Math.min(width - pad, Math.max(pad, n.x ?? cx));
    n.y = Math.min(height - pad, Math.max(pad, n.y ?? cy));
  }

  return { nodes, links };
}
