/**
 * Astro ARC Mind Map main.js
 * Author: beanfrog / Graeme Kieran
 * License: MIT
 */

(async () => {
  const res = await fetch("./data.json");
  window.mapData = await res.json();
  const canvas = document.getElementById("map");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("tooltip");
  const tooltipOffset = 15;

  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;
  let scale = 1; // zoom level
  const MIN_SCALE = 0.1; // min zoom out
  const MAX_SCALE = 3; // max zoom in
  const SCALE_FACTOR = 1.1; // zoom step

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }
  window.addEventListener("resize", resizeCanvas);

  // Data Prep

  // Get names (used in single person display)
  let names = [];
  window.mapData.forEach((person) => {
    names.push(person.name);
  });

  // Populate stats modal (all, big stats)
  const totalContributors = document.getElementById("totalContributors");
  const uniqueWords = document.getElementById("uniqueWords");
  const uniqueConnections = document.getElementById("uniqueConnections");

  totalContributors.innerHTML = window.mapData.length;

  let words = [];
  window.mapData.forEach((entry) => {
    entry.nodes.forEach((node) => {
      words.push(node);
    });
  });
  // Keep untrimmed words for later
  const allWords = words;
  // Ensure no duplicates
  words = [...new Set(words)];
  uniqueWords.innerHTML = words.length;

  let conns = [];
  window.mapData.forEach((entry) => {
    entry.connections.forEach((connection) => {
      conns.push(connection);
    });
  });
  // Keep untrimmed connections for later
  const allConns = conns;
  // Ensure no duplicates
  conns = [...new Set(conns)];
  uniqueConnections.innerHTML = conns.length;

  // === Stats Table Population and Sorting ===
  const statsTable = document.getElementById("statsWordsBody");

  words.forEach((word) => {
    const wordCount = allWords.filter((w) => w === word).length;
    const connectionsCount = allConns.filter((conn) =>
      conn.includes(word),
    ).length;
    const row = statsTable.insertRow();

    const wordCell = row.insertCell(0);
    wordCell.textContent = word;

    const wordCountCell = row.insertCell(1);
    wordCountCell.textContent = wordCount;

    const connectionsCountCell = row.insertCell(2);
    connectionsCountCell.textContent = connectionsCount;
  });

  // Handle table sorting logic
  const sortWordBtn = document.getElementById("sortWordBtn");
  const sortAppearancesBtn = document.getElementById("sortAppearancesBtn");
  const sortConnectionsBtn = document.getElementById("sortConnectionsBtn");
  const statsWordsBody = document.getElementById("statsWordsBody");

  function sortTable(compareFn) {
    const rows = Array.from(statsWordsBody.querySelectorAll("tr"));
    rows.sort(compareFn);
    rows.forEach((row) => statsWordsBody.appendChild(row));
  }

  // Sort alphabetically
  sortWordBtn.addEventListener("click", () => {
    sortTable((a, b) => {
      const wordA = a.cells[0].textContent.toLowerCase();
      const wordB = b.cells[0].textContent.toLowerCase();
      return wordA.localeCompare(wordB);
    });
  });

  // Sort numerically by # of appearances
  sortAppearancesBtn.addEventListener("click", () => {
    sortTable((a, b) => {
      const numA = parseInt(a.cells[1].textContent, 10);
      const numB = parseInt(b.cells[1].textContent, 10);
      return numB - numA; // Descending
    });
  });

  // Sort numerically by # of connections
  sortConnectionsBtn.addEventListener("click", () => {
    sortTable((a, b) => {
      const numA = parseInt(a.cells[2].textContent, 10);
      const numB = parseInt(b.cells[2].textContent, 10);
      return numB - numA; // Descending
    });
  });

  // === Individual Stats Tab ===
  const individualNameSelector = document.getElementById(
    "individualNameSelector",
  );

  // Add names to DOM element
  names.forEach((name) => {
    let nameOption = document.createElement("option");
    nameOption.classList.add("bg-transparent", "px-2", "py-1");
    nameOption.innerText = name;
    nameOption.value = name;
    individualNameSelector.insertAdjacentElement("beforeend", nameOption);
  });

  // repopulate stats on selector change
  individualNameSelector.addEventListener("change", populateIndividualStats);

  // populate individual stats
  function populateIndividualStats() {
    const name = individualNameSelector.value;
    const personData = window.mapData.find((p) => p.name === name);
    if (!personData) return;

    // big stats
    document.getElementById("individualWords").innerHTML =
      personData.nodes.length;
    document.getElementById("individualConnections").innerHTML =
      personData.connections.length;

    // connections
    personData.connections.forEach((connection) => {
      const tableBody = document.getElementById("individualConnectionsBody");
      const row = tableBody.insertRow();
      const word1Cell = row.insertCell(0);
      word1Cell.textContent = connection[0];
      word1Cell.classList.add("text-right");
      const dividerCell = row.insertCell(1);
      dividerCell.textContent = "<────────>";
      dividerCell.classList.add("text-center");
      const word2Cell = row.insertCell(2);
      word2Cell.textContent = connection[1];
      word2Cell.classList.add("text-left");
    });
  }
  // Initial population
  populateIndividualStats();

  // Name selector and highlight controls

  const nameSelector = document.getElementById("nameSelector");
  const showNameCheckbox = document.getElementById("showIndividual");

  // Add names to DOM element
  names.forEach((name) => {
    let nameOption = document.createElement("option");
    nameOption.classList.add("bg-transparent", "px-2", "py-1");
    nameOption.innerText = name;
    nameOption.value = name;
    nameSelector.insertAdjacentElement("beforeend", nameOption);
  });

  // change highlight on name selector change
  nameSelector.addEventListener("change", function () {
    console.log("change called");
    delete window.highlightedPerson;
    selAndDraw();
  });

  // Store drawHighlights function globally
  window.drawHighlights = null;

  // Handle selector activation
  showNameCheckbox.addEventListener("change", selAndDraw);
  function selAndDraw() {
    if (showNameCheckbox.checked) {
      const selectedName = nameSelector.value;
      const personData = window.mapData.find((p) => p.name === selectedName);
      if (!personData) return;

      // Store for re-render
      window.highlightedPerson = selectedName;

      window.drawHighlights = function () {
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);

        // Highlighted connections
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)"; // amber-500, slightly dimmed
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(245, 158, 11, 0.3)";
        ctx.shadowBlur = 6;

        personData.connections.forEach(([from, to]) => {
          const fromPos = nodePositions.get(from);
          const toPos = nodePositions.get(to);
          if (fromPos && toPos) {
            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.stroke();
          }
        });

        // Highlighted nodes
        personData.nodes.forEach((node) => {
          const pos = nodePositions.get(node);
          const dims = nodeDimensions.get(node);
          if (!pos || !dims) return;

          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(245, 158, 11, 0.3)";

          ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
          ctx.strokeStyle = "rgba(202, 138, 4, 0.8)";
          ctx.lineWidth = 2;

          if (dims.type === "circle") {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dims.radius + 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px 'Inter', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node, pos.x, pos.y);
          } else {
            const pad = 4;
            const x = pos.x - dims.width / 2 - pad;
            const y = pos.y - dims.height / 2 - pad;
            const w = dims.width + pad * 2;
            const h = dims.height + pad * 2;
            const r = 10;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px 'Inter', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node, pos.x, pos.y);
          }
        });

        ctx.shadowBlur = 0;
        ctx.restore();
      };

      // Redraw base + highlights
      draw();
      window.drawHighlights();
    } else {
      delete window.highlightedPerson;
      window.drawHighlights = null;
      draw();
    }
  }

  // Node/Connection maps
  const nodeMap = new Map();
  const connectionMap = new Map();
  console.log(connectionMap);
  window.mapData.forEach((person) => {
    person.nodes.forEach((node) => {
      if (!nodeMap.has(node)) {
        nodeMap.set(node, []);
      }
      nodeMap.get(node).push(person.name);
    });

    person.connections.forEach(([from, to]) => {
      const key = [from, to].sort().join("|");
      if (!connectionMap.has(key)) {
        connectionMap.set(key, []);
      }
      connectionMap.get(key).push(person.name);
    });
  });

  // Node layout and position
  const nodes = Array.from(nodeMap.keys());
  const nodePositions = new Map();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const MIN_NODE_DISTANCE = 120;

  // Center "Astronomy" node
  nodePositions.set("Astronomy", { x: centerX, y: centerY });
  const otherNodes = nodes.filter((n) => n !== "Astronomy");

  function ringCapacity(radius) {
    return Math.floor((2 * Math.PI * radius) / MIN_NODE_DISTANCE);
  }

  // Place nodes in concentric rings
  let assignedIndex = 0;
  let ringIndex = 1;
  while (assignedIndex < otherNodes.length) {
    const radius = ringIndex * MIN_NODE_DISTANCE * 1.5; // spacing factor
    const capacity = ringCapacity(radius);

    const nodesInRing = otherNodes.slice(
      assignedIndex,
      assignedIndex + capacity,
    );
    nodesInRing.forEach((node, i) => {
      const angle = (i / nodesInRing.length) * 2 * Math.PI - Math.PI / 2;
      nodePositions.set(node, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    assignedIndex += capacity;
    ringIndex++;
  }

  // Force based spacing for overlap correction
  for (let iteration = 0; iteration < 50; iteration++) {
    const forces = new Map();
    nodePositions.forEach((pos, node) => {
      forces.set(node, { x: 0, y: 0 });
    });

    const nodeArray = Array.from(nodePositions.keys());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const node1 = nodeArray[i];
        const node2 = nodeArray[j];
        const pos1 = nodePositions.get(node1);
        const pos2 = nodePositions.get(node2);
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_NODE_DISTANCE && dist > 0) {
          const force = ((MIN_NODE_DISTANCE - dist) / dist) * 0.5;
          const fx = dx * force;
          const fy = dy * force;
          const force1 = forces.get(node1);
          const force2 = forces.get(node2);
          force1.x -= fx;
          force1.y -= fy;
          force2.x += fx;
          force2.y += fy;
        }
      }
    }
    forces.forEach((force, node) => {
      if (node !== "Astronomy") {
        const pos = nodePositions.get(node);
        pos.x += force.x;
        pos.y += force.y;
      }
    });
  }

  // Node dimension calculations
  const nodeDimensions = new Map();
  nodeMap.forEach((people, node) => {
    const isCenter = node === "Astronomy";
    if (isCenter) {
      const baseRadius = 30 + people.length * 2;
      nodeDimensions.set(node, {
        type: "circle",
        radius: baseRadius,
        width: baseRadius * 2,
        height: baseRadius * 2,
      });
    } else {
      ctx.font = "12px sans-serif";
      const textWidth = ctx.measureText(node).width;
      const padding = 16;
      const width = Math.max(textWidth + padding * 2, 80);
      const height = 40;
      nodeDimensions.set(node, {
        type: "rect",
        width: width,
        height: height,
      });
    }
  });

  // Main draw function
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    // Connections
    connectionMap.forEach((people, key) => {
      const [from, to] = key.split("|");
      const fromPos = nodePositions.get(from);
      const toPos = nodePositions.get(to);
      if (fromPos && toPos) {
        const opacity = Math.min(0.3 + people.length * 0.15, 1);
        ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
        ctx.lineWidth = 1 + people.length * 0.5;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // Nodes
    nodeMap.forEach((people, node) => {
      const pos = nodePositions.get(node);
      const dims = nodeDimensions.get(node);
      if (!pos || !dims) return;

      // Global shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      const fillColor = "rgba(31, 41, 55, 0.85)"; // bg-gray-800/85
      const strokeColor = "rgba(148, 163, 184, 0.35)"; // slate-400/35
      const glowColor = "rgba(99, 102, 241, 0.8)"; // indigo-500-ish

      if (dims.type === "circle") {
        // Fill
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dims.radius, 0, 2 * Math.PI);
        ctx.fill();

        // Border
        ctx.shadowBlur = 2;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "500 14px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node, pos.x, pos.y);
      } else {
        const x = pos.x - dims.width / 2;
        const y = pos.y - dims.height / 2;
        const w = dims.width;
        const h = dims.height;
        const r = 10;

        // Rounded rectangle path
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);

        // Fill
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Border glow
        ctx.shadowBlur = 2;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "500 13px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node, pos.x, pos.y);
      }

      // Reset effects
      ctx.shadowBlur = 0;
    });

    ctx.restore();
    // redraw highlights if enabled
    if (document.getElementById("showIndividual").checked) {
      window.drawHighlights();
    }
  }

  // Interactions (pan, zoom)

  // Pan controls
  canvas.addEventListener("mousedown", (e) => {
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
    canvas.style.cursor = "grabbing";

    //display extra tooltip info
    document.getElementById("ttNodeConns").style.display = "block";

    // Prevent unwanted selection
    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    //hide extra tooltip info
    document.getElementById("ttNodeConns").style.display = "none";

    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = "grab";
    }
  });

  // Handle panning and tooltips
  window.addEventListener("mousemove", (e) => {
    // Skip tooltips while panning
    if (isPanning) {
      panX = e.clientX - startPanX;
      panY = e.clientY - startPanY;
      draw();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX =
      ((e.clientX - rect.left) * (canvas.width / rect.width) - panX) / scale;
    const mouseY =
      ((e.clientY - rect.top) * (canvas.height / rect.height) - panY) / scale;

    let found = false;

    nodeMap.forEach((people, node) => {
      const pos = nodePositions.get(node);
      const dims = nodeDimensions.get(node);
      if (!pos || !dims) return;

      let isInside = false;

      if (dims.type === "circle") {
        const dist = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
        isInside = dist < dims.radius;
      } else {
        isInside =
          mouseX >= pos.x - dims.width / 2 &&
          mouseX <= pos.x + dims.width / 2 &&
          mouseY >= pos.y - dims.height / 2 &&
          mouseY <= pos.y + dims.height / 2;
      }

      if (isInside && !found) {
        // Get connections with this node for tooltip
        const nodeConns = allConns
          .filter(([a, b]) => a === node || b === node)
          .map(([a, b]) => (a === node ? b : a));
        let nodeConnsHTML = ``;
        nodeConnsHTML += "<p>";
        nodeConns.forEach((conn) => {
          nodeConnsHTML += `${conn}, `;
        });
        nodeConnsHTML += "</p>";
        tooltip.innerHTML = `<strong>${node}</strong><br>${people.join(", ")}<br><span id='ttNodeConns' style='display:none'><hr><strong>Connected To:</strong><p>${nodeConnsHTML}</p></span>`;
        tooltip.style.left = e.clientX + tooltipOffset + "px";
        tooltip.style.top = e.clientY + tooltipOffset + "px";
        tooltip.style.opacity = "1";
        found = true;
      }
    });

    if (!found) {
      connectionMap.forEach((people, key) => {
        const [from, to] = key.split("|");
        const fromPos = nodePositions.get(from);
        const toPos = nodePositions.get(to);
        if (fromPos && toPos) {
          const dist = distanceToLine(
            mouseX,
            mouseY,
            fromPos.x,
            fromPos.y,
            toPos.x,
            toPos.y,
          );
          if (dist < 2 && !found) {
            tooltip.innerHTML = `<strong>${from} ↔ ${to}</strong><br>${people.join(", ")}`;
            tooltip.style.left = e.clientX + tooltipOffset + "px";
            tooltip.style.top = e.clientY + tooltipOffset + "px";
            tooltip.style.opacity = "1";
            found = true;
          }
        }
      });
    }

    if (!found) tooltip.style.opacity = "0";
    canvas.style.cursor = found ? "pointer" : "grab";
  });

  // Distance to line
  function distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Zoom handler
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - panX) / scale;
      const worldY = (mouseY - panY) / scale;
      if (e.deltaY < 0) scale *= SCALE_FACTOR;
      else scale /= SCALE_FACTOR;
      scale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
      panX = mouseX - worldX * scale;
      panY = mouseY - worldY * scale;
      draw();
    },
    { passive: false },
  );

  // Start rendering
  resizeCanvas();
})();
