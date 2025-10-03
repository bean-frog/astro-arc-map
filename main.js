const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const tooltipOffset = 15;

let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let scale = 1;            // zoom level
const MIN_SCALE = 0.3;    // min zoom out
const MAX_SCALE = 3;      // max zoom in
const SCALE_FACTOR = 1.1; // zoom step

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}
window.addEventListener('resize', resizeCanvas);

// Get nodes and connections
const nodeMap = new Map();
const connectionMap = new Map();

window.mapData.forEach(person => {
    person.nodes.forEach(node => {
        if (!nodeMap.has(node)) {
            nodeMap.set(node, []);
        }
        nodeMap.get(node).push(person.name);
    });

    person.connections.forEach(([from, to]) => {
        const key = [from, to].sort().join('|');
        if (!connectionMap.has(key)) {
            connectionMap.set(key, []);
        }
        connectionMap.get(key).push(person.name);
    });
});
//


// Create node positions
const nodes = Array.from(nodeMap.keys());
const nodePositions = new Map();
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const MIN_NODE_DISTANCE = 120;

// Center "Astronomy" node
nodePositions.set("Astronomy", { x: centerX, y: centerY });

const otherNodes = nodes.filter(n => n !== "Astronomy");

function ringCapacity(radius) {
    return Math.floor((2 * Math.PI * radius) / MIN_NODE_DISTANCE);
}

// Place nodes in concentric rings
let assignedIndex = 0;
let ringIndex = 1;
while (assignedIndex < otherNodes.length) {
    const radius = ringIndex * MIN_NODE_DISTANCE * 1.5; // spacing factor
    const capacity = ringCapacity(radius);

    const nodesInRing = otherNodes.slice(assignedIndex, assignedIndex + capacity);
    nodesInRing.forEach((node, i) => {
        const angle = (i / nodesInRing.length) * 2 * Math.PI - Math.PI / 2;
        nodePositions.set(node, {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
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
                const force = (MIN_NODE_DISTANCE - dist) / dist * 0.5;
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

// Calculate node dimensions
const nodeDimensions = new Map();
nodeMap.forEach((people, node) => {
    const isCenter = node === "Astronomy";
    if (isCenter) {
        const baseRadius = 30 + people.length * 2;
        nodeDimensions.set(node, { 
            type: 'circle', 
            radius: baseRadius,
            width: baseRadius * 2,
            height: baseRadius * 2
        });
    } else {
        ctx.font = '12px sans-serif';
        const textWidth = ctx.measureText(node).width;
        const padding = 16;
        const width = Math.max(textWidth + padding * 2, 80);
        const height = 40;
        nodeDimensions.set(node, { 
            type: 'rect', 
            width: width,
            height: height
        });
    }
});

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    // Connections
    connectionMap.forEach((people, key) => {
        const [from, to] = key.split('|');
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

        if (dims.type === 'circle') {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dims.radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#1e40af';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node, pos.x, pos.y);
        } else {
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(pos.x - dims.width / 2, pos.y - dims.height / 2, dims.width, dims.height);
            ctx.strokeStyle = '#1e40af';
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - dims.width / 2, pos.y - dims.height / 2, dims.width, dims.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node, pos.x, pos.y);
        }
    });
    
    ctx.restore();
}

// Pan controls
canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        draw();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) * (canvas.width / rect.width) - panX) / scale;
    const mouseY = ((e.clientY - rect.top) * (canvas.height / rect.height) - panY) / scale;

    let found = false;

    nodeMap.forEach((people, node) => {
        const pos = nodePositions.get(node);
        const dims = nodeDimensions.get(node);
        if (!pos || !dims) return;

        let isInside = false;
        
        if (dims.type === 'circle') {
            const dist = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
            isInside = dist < dims.radius;
        } else {
            isInside = mouseX >= pos.x - dims.width / 2 && 
                       mouseX <= pos.x + dims.width / 2 &&
                       mouseY >= pos.y - dims.height / 2 && 
                       mouseY <= pos.y + dims.height / 2;
        }

        if (isInside && !found) {
            tooltip.innerHTML = `<strong>${node}</strong><br>${people.join(', ')}`;
            tooltip.style.left = e.clientX + tooltipOffset + 'px';
            tooltip.style.top = e.clientY + tooltipOffset + 'px';
            tooltip.style.opacity = '1';
            found = true;
        }
    });

    if (!found) {
        connectionMap.forEach((people, key) => {
            const [from, to] = key.split('|');
            const fromPos = nodePositions.get(from);
            const toPos = nodePositions.get(to);
            if (fromPos && toPos) {
                const dist = distanceToLine(mouseX, mouseY, fromPos.x, fromPos.y, toPos.x, toPos.y);
                if (dist < 10 && !found) {
                    tooltip.innerHTML = `<strong>${from} ↔ ${to}</strong><br>${people.join(', ')}`;
                    tooltip.style.left = e.clientX + tooltipOffset + 'px';
                    tooltip.style.top = e.clientY + tooltipOffset + 'px';
                    tooltip.style.opacity = '1';
                    found = true;
                }
            }
        });
    }

    if (!found) tooltip.style.opacity = '0';
    canvas.style.cursor = found ? 'pointer' : 'grab';
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
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Zoom handler
canvas.addEventListener('wheel', (e) => {
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
}, { passive: false });

resizeCanvas();
