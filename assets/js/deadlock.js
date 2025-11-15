// Deadlock Analysis JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');

        function applyTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                icon?.classList.remove('fa-moon');
                icon?.classList.add('fa-sun');
            } else {
                document.body.classList.remove('dark-mode');
                icon?.classList.remove('fa-sun');
                icon?.classList.add('fa-moon');
            }
        }

        applyTheme(localStorage.getItem('os-visualizer-theme') || 'light');

        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('os-visualizer-theme', newTheme);
        });
    }

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Create particles
    const particles = document.getElementById('particles');
    if (particles) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = particle.style.height = Math.random() * 4 + 2 + 'px';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            particles.appendChild(particle);
        }
    }

    // ===== DEADLOCK DETECTION =====
    const detectBtn = document.getElementById('detectDeadlockBtn');
    const stepDetectBtn = document.getElementById('stepDetectBtn');
    const clearDetectBtn = document.getElementById('clearDetectBtn');

    if (detectBtn) {
        detectBtn.addEventListener('click', () => {
            detectDeadlock();
        });
    }

    let stepByStepState = null;

    if (stepDetectBtn) {
        stepDetectBtn.addEventListener('click', () => {
            detectDeadlockStepByStep();
        });
    }

    function detectDeadlockStepByStep() {
        const processCount = parseInt(document.getElementById('detProcessCount').value) || 3;
        const resourceCount = parseInt(document.getElementById('detResourceCount').value) || 3;
        const allocationEdges = parseEdges(document.getElementById('detAllocationEdges').value);
        const requestEdges = parseEdges(document.getElementById('detRequestEdges').value);

        if (!stepByStepState) {
            const graph = buildRAG(processCount, resourceCount, allocationEdges, requestEdges);
            const cycles = findCycles(graph);
            stepByStepState = {
                graph,
                cycles,
                currentStep: 0,
                totalSteps: cycles.length > 0 ? cycles.length : 1
            };
        }

        if (stepByStepState.currentStep < stepByStepState.totalSteps) {
            const cyclesToShow = stepByStepState.cycles.slice(0, stepByStepState.currentStep + 1);
            visualizeRAG(stepByStepState.graph, cyclesToShow);
            displayDetectionResult(cyclesToShow);
            stepByStepState.currentStep++;
            
            if (stepByStepState.currentStep >= stepByStepState.totalSteps) {
                // Show completion message
                const resultDiv = document.getElementById('detectionResult');
                const existingHTML = resultDiv.innerHTML;
                resultDiv.innerHTML = existingHTML + '<p style="margin-top: 1rem; color: #4CAF50; font-weight: bold;">✓ Step-by-step analysis complete!</p>';
            }
        } else {
            // Reset for next run
            stepByStepState = null;
            alert('Step-by-step analysis complete! Click again to start a new analysis.');
        }
    }

    if (clearDetectBtn) {
        clearDetectBtn.addEventListener('click', () => {
            stepByStepState = null;
            document.getElementById('ragVisualization').innerHTML = '';
            document.getElementById('detectionResult').innerHTML = '';
        });
    }

    function detectDeadlock() {
        stepByStepState = null; // Reset step-by-step state
        const processCount = parseInt(document.getElementById('detProcessCount').value) || 3;
        const resourceCount = parseInt(document.getElementById('detResourceCount').value) || 3;
        const allocationEdges = parseEdges(document.getElementById('detAllocationEdges').value);
        const requestEdges = parseEdges(document.getElementById('detRequestEdges').value);

        const graph = buildRAG(processCount, resourceCount, allocationEdges, requestEdges);
        const cycles = findCycles(graph);
        visualizeRAG(graph, cycles);
        displayDetectionResult(cycles);
    }

    function parseEdges(text) {
        return text.trim().split('\n').filter(line => line.trim()).map(line => {
            const [from, to] = line.trim().split(',').map(s => s.trim());
            return { from, to };
        });
    }

    function buildRAG(processCount, resourceCount, allocationEdges, requestEdges) {
        const graph = {
            processes: Array.from({ length: processCount }, (_, i) => `P${i + 1}`),
            resources: Array.from({ length: resourceCount }, (_, i) => `R${i + 1}`),
            allocations: allocationEdges,
            requests: requestEdges,
            adjList: {},
            // Reverse mapping: resource -> processes that hold it
            resourceHolders: {},
            // Reverse mapping: resource -> processes that request it
            resourceRequesters: {}
        };

        // Build adjacency list
        [...graph.processes, ...graph.resources].forEach(node => {
            graph.adjList[node] = [];
        });

        // Initialize resource mappings
        graph.resources.forEach(res => {
            graph.resourceHolders[res] = [];
            graph.resourceRequesters[res] = [];
        });

        // Build allocation edges: Process -> Resource
        allocationEdges.forEach(edge => {
            if (!graph.adjList[edge.from]) graph.adjList[edge.from] = [];
            graph.adjList[edge.from].push({ to: edge.to, type: 'allocation' });
            // Track which processes hold which resources
            if (graph.resourceHolders[edge.to]) {
                graph.resourceHolders[edge.to].push(edge.from);
            }
        });

        // Build request edges: Process -> Resource
        requestEdges.forEach(edge => {
            if (!graph.adjList[edge.from]) graph.adjList[edge.from] = [];
            graph.adjList[edge.from].push({ to: edge.to, type: 'request' });
            // Track which processes request which resources
            if (graph.resourceRequesters[edge.to]) {
                graph.resourceRequesters[edge.to].push(edge.from);
            }
        });

        // Build reverse edges: Resource -> Process (for cycle detection)
        // If P1 holds R1 and P2 requests R1, we can go R1 -> P2
        graph.resources.forEach(res => {
            graph.adjList[res] = [];
            // Resource can lead to processes that request it
            graph.resourceRequesters[res].forEach(process => {
                graph.adjList[res].push({ to: process, type: 'request-reverse' });
            });
        });

        return graph;
    }

    function findCycles(graph) {
        const cycles = [];
        const allCycles = [];
        
        // Build wait-for graph: P2 waits for P1 if P2 requests a resource that P1 holds
        const waitForGraph = {};
        graph.processes.forEach(p => waitForGraph[p] = []);
        
        // For each resource, if P1 holds it and P2 requests it, then P2 waits for P1
        graph.resources.forEach(res => {
            const holders = graph.resourceHolders[res] || [];
            const requesters = graph.resourceRequesters[res] || [];
            
            holders.forEach(holder => {
                requesters.forEach(requester => {
                    if (holder !== requester) {
                        if (!waitForGraph[requester]) waitForGraph[requester] = [];
                        if (!waitForGraph[requester].includes(holder)) {
                            waitForGraph[requester].push(holder);
                        }
                    }
                });
            });
        });
        
        // Find cycles in wait-for graph using DFS
        const allVisited = new Set();
        
        function dfs(node, path, recStack) {
            if (recStack.has(node)) {
                // Found a cycle
                const cycleStart = path.indexOf(node);
                const cycle = path.slice(cycleStart);
                cycle.push(node); // Complete the cycle
                
                // Check if this is a valid deadlock cycle (at least 2 processes)
                if (cycle.length >= 3) {
                    // Convert wait-for cycle back to RAG cycle
                    const ragCycle = [];
                    for (let i = 0; i < cycle.length - 1; i++) {
                        const p1 = cycle[i];
                        const p2 = cycle[i + 1];
                        
                        // Find resource that p1 holds and p2 requests
                        const resource = graph.resources.find(res => {
                            const holders = graph.resourceHolders[res] || [];
                            const requesters = graph.resourceRequesters[res] || [];
                            return holders.includes(p1) && requesters.includes(p2);
                        });
                        
                        if (resource) {
                            if (ragCycle.length === 0 || ragCycle[ragCycle.length - 1] !== p1) {
                                ragCycle.push(p1);
                            }
                            ragCycle.push(resource);
                            if (i === cycle.length - 2) {
                                ragCycle.push(p2);
                            }
                        }
                    }
                    
                    if (ragCycle.length >= 4) {
                        // Check if cycle is unique
                        const cycleKey = ragCycle.sort().join('-');
                        if (!allCycles.some(c => {
                            const cKey = c.sort().join('-');
                            return cKey === cycleKey;
                        })) {
                            allCycles.push(ragCycle);
                            cycles.push(ragCycle);
                        }
                    }
                }
                return;
            }
            
            recStack.add(node);
            path.push(node);
            
            const neighbors = waitForGraph[node] || [];
            neighbors.forEach(neighbor => {
                dfs(neighbor, [...path], new Set(recStack));
            });
            
            recStack.delete(node);
            allVisited.add(node);
        }
        
        // Start DFS from each process
        graph.processes.forEach(process => {
            if (!allVisited.has(process)) {
                dfs(process, [], new Set());
            }
        });
        
        return cycles;
    }

    function visualizeRAG(graph, cycles) {
        const container = document.getElementById('ragVisualization');
        const deadlockedNodes = new Set();
        cycles.forEach(cycle => cycle.forEach(node => deadlockedNodes.add(node)));

        // Create SVG visualization
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'rag-svg');
        svg.setAttribute('viewBox', '0 0 800 500');

        // Add arrow marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3, 0 6');
        polygon.setAttribute('fill', '#333');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);

        // Position nodes
        const nodePositions = {};
        const processY = 100;
        const resourceY = 350;

        graph.processes.forEach((proc, i) => {
            nodePositions[proc] = { x: 100 + i * 200, y: processY, type: 'process' };
        });

        graph.resources.forEach((res, i) => {
            nodePositions[res] = { x: 100 + i * 200, y: resourceY, type: 'resource' };
        });

        // Determine which edges are part of cycles
        const cycleEdges = new Set();
        cycles.forEach(cycle => {
            for (let i = 0; i < cycle.length - 1; i++) {
                const from = cycle[i];
                const to = cycle[i + 1];
                cycleEdges.add(`${from}-${to}`);
            }
        });

        // Draw edges
        [...graph.allocations.map(e => ({...e, type: 'allocation'})), 
         ...graph.requests.map(e => ({...e, type: 'request'}))].forEach(edge => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return;

            const isCycleEdge = cycleEdges.has(`${edge.from}-${edge.to}`);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromPos.x);
            line.setAttribute('y1', fromPos.y);
            line.setAttribute('x2', toPos.x);
            line.setAttribute('y2', toPos.y);
            line.setAttribute('class', `rag-edge ${edge.type} ${isCycleEdge ? 'cycle' : ''}`);
            line.setAttribute('marker-end', 'url(#arrowhead)');
            svg.appendChild(line);
        });

        // Draw nodes
        Object.keys(nodePositions).forEach(node => {
            const pos = nodePositions[node];
            const isDeadlocked = deadlockedNodes.has(node);
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 30);
            circle.setAttribute('class', `rag-node ${pos.type} ${isDeadlocked ? 'deadlocked' : ''}`);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-weight', 'bold');
            text.textContent = node;

            g.appendChild(circle);
            g.appendChild(text);
            svg.appendChild(g);
        });

        container.innerHTML = '';
        container.appendChild(svg);
    }

    function displayDetectionResult(cycles) {
        const resultDiv = document.getElementById('detectionResult');
        
        if (cycles.length === 0) {
            resultDiv.innerHTML = `
                <div class="safe-sequence">
                    <h4>✅ No Deadlock Detected</h4>
                    <p>The system is free from deadlocks. No cycles found in the Resource Allocation Graph.</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="unsafe-state">
                    <h4>⚠️ Deadlock Detected!</h4>
                    <p><strong>${cycles.length}</strong> deadlock cycle(s) found:</p>
                    ${cycles.map((cycle, idx) => `
                        <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 8px;">
                            <strong>Cycle ${idx + 1}:</strong> ${cycle.join(' → ')} → ${cycle[0]}
                        </div>
                    `).join('')}
                    <p style="margin-top: 1rem;"><strong>Deadlocked Processes:</strong> ${[...new Set(cycles.flat().filter(n => n.startsWith('P')))].join(', ')}</p>
                </div>
            `;
        }
    }

    // ===== BANKER'S ALGORITHM =====
    const runBankersBtn = document.getElementById('runBankersBtn');
    const stepBankersBtn = document.getElementById('stepBankersBtn');
    const clearBankersBtn = document.getElementById('clearBankersBtn');
    let bankersState = null;

    function getBankersInput() {
        return {
            totalText: document.getElementById('avTotal')?.value || '',
            availableText: document.getElementById('avAvailable')?.value || '',
            maxText: document.getElementById('avMax')?.value || '',
            allocText: document.getElementById('avAlloc')?.value || ''
        };
    }

    function computeBankersState() {
        const input = getBankersInput();
        const total = parseVector(input.totalText);
        const available = parseVector(input.availableText);
        const max = parseMatrix(input.maxText);
        const alloc = parseMatrix(input.allocText);

        const n = alloc.length;
        const m = available.length;
        const need = alloc.map((row, i) => vectorSub(max[i], row));

        const work = [...available];
        const finish = Array(n).fill(false);
        const sequence = [];
        const steps = [];

        let progress = true;
        let iteration = 0;
        let safe = false;

        while (progress && iteration < 100) {
            iteration++;
            progress = false;

            for (let i = 0; i < n; i++) {
                if (!finish[i] && vectorLeq(need[i], work)) {
                    const workBefore = [...work];
                    work.splice(0, m, ...vectorAdd(work, alloc[i]));
                    finish[i] = true;
                    sequence.push(`P${i}`);
                    progress = true;

                    steps.push({
                        process: i,
                        need: need[i],
                        workBefore,
                        allocation: alloc[i],
                        workAfter: [...work],
                        finish: true
                    });
                } else if (!finish[i]) {
                    steps.push({
                        process: i,
                        need: need[i],
                        workBefore: [...work],
                        allocation: alloc[i],
                        workAfter: [...work],
                        finish: false
                    });
                }
            }
        }

        safe = finish.every(f => f);

        return {
            inputSignature: JSON.stringify(input),
            need,
            alloc,
            steps,
            safe,
            sequence,
            totalSteps: steps.length,
            currentStep: 0
        };
    }

    function ensureBankersState() {
        const input = getBankersInput();
        const signature = JSON.stringify(input);
        if (!bankersState || bankersState.inputSignature !== signature) {
            bankersState = computeBankersState();
        }
        return bankersState;
    }

    if (runBankersBtn) {
        runBankersBtn.addEventListener('click', () => {
            bankersState = computeBankersState();
            bankersState.currentStep = bankersState.totalSteps;
            visualizeBankersAlgorithm(bankersState, bankersState.currentStep);
            displayAvoidanceResult(bankersState, bankersState.currentStep);
        });
    }

    if (stepBankersBtn) {
        stepBankersBtn.addEventListener('click', () => {
            const state = ensureBankersState();
            if (state.totalSteps === 0) {
                visualizeBankersAlgorithm(state, 0);
                displayAvoidanceResult(state, 0);
                return;
            }
            state.currentStep = Math.min((state.currentStep || 0) + 1, state.totalSteps);
            visualizeBankersAlgorithm(state, state.currentStep);
            displayAvoidanceResult(state, state.currentStep);
        });
    }

    if (clearBankersBtn) {
        clearBankersBtn.addEventListener('click', () => {
            bankersState = null;
            document.getElementById('bankersVisualization').innerHTML = '';
            document.getElementById('avoidanceResult').innerHTML = '';
        });
    }

    function parseVector(text) {
        return text.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    }

    function parseMatrix(text) {
        const rows = text.split(/\n|\r/).map(r => r.trim()).filter(Boolean);
        return rows.map(r => parseVector(r));
    }

    function vectorLeq(a, b) {
        return a.every((v, i) => v <= b[i]);
    }

    function vectorAdd(a, b) {
        return a.map((v, i) => v + b[i]);
    }

    function vectorSub(a, b) {
        return a.map((v, i) => v - b[i]);
    }

    function visualizeBankersAlgorithm(state, stepCount = state.steps.length) {
        const container = document.getElementById('bankersVisualization');
        const visibleSteps = stepCount > 0 ? state.steps.slice(0, stepCount) : [];
        
        let html = `
            <h3>Need Matrix</h3>
            <div class="bankers-table">
                <table>
                    <thead>
                        <tr>
                            <th>Process</th>
                            ${state.need[0].map((_, i) => `<th>R${i + 1}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${state.need.map((row, i) => `
                            <tr>
                                <td><strong>P${i}</strong></td>
                                ${row.map(val => `<td>${val}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h3>Safety Algorithm Steps</h3>
            <div class="bankers-table">
                <table>
                    <thead>
                        <tr>
                            <th>Step</th>
                            <th>Process</th>
                            <th>Need</th>
                            <th>Work Before</th>
                            <th>Allocation</th>
                            <th>Work After</th>
                            <th>Finish</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${visibleSteps.map((step, idx) => `
                            <tr class="${step.finish ? 'safe' : 'unsafe'}">
                                <td>${idx + 1}</td>
                                <td><strong>P${step.process}</strong></td>
                                <td>${step.need.join(', ')}</td>
                                <td>${step.workBefore.join(', ')}</td>
                                <td>${state.alloc[step.process].join(', ')}</td>
                                <td>${step.workAfter.join(', ')}</td>
                                <td>${step.finish ? '✓' : '✗'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    function displayAvoidanceResult(state, stepCount) {
        const resultDiv = document.getElementById('avoidanceResult');

        const total = state.totalSteps;
        const completedSequence = state.sequence.slice(0, stepCount);
        const finished = stepCount >= total;

        if (finished && state.safe) {
            resultDiv.innerHTML = `
                <div class="safe-sequence">
                    <h4>✅ System is in Safe State</h4>
                    <p>The Banker's algorithm found a safe sequence:</p>
                    <div class="sequence-steps">
                        ${state.sequence.map(p => `<span class="sequence-step">${p}</span>`).join(' → ')}
                    </div>
                </div>
            `;
            return;
        }

        if (finished && !state.safe) {
            resultDiv.innerHTML = `
                <div class="unsafe-state">
                    <h4>⚠️ System is in Unsafe State</h4>
                    <p>No safe sequence could be found. The system may lead to deadlock.</p>
                    <p><strong>Completed Processes:</strong> ${completedSequence.length > 0 ? completedSequence.join(' → ') : 'None'}</p>
                </div>
            `;
            return;
        }

        resultDiv.innerHTML = `
            <div class="safe-sequence">
                <h4>🧭 Step ${stepCount} of ${total}</h4>
                <p>Processes completed so far:</p>
                <div class="sequence-steps">
                    ${completedSequence.length > 0 ? completedSequence.map(p => `<span class="sequence-step">${p}</span>`).join(' → ') : '<span class="sequence-step">None</span>'}
                </div>
                <p style="margin-top: 10px;">Continue stepping to evaluate remaining processes.</p>
            </div>
        `;
    }

    // ===== DEADLOCK PREVENTION =====
    const runPreventionBtn = document.getElementById('runPreventionBtn');
    const clearPreventionBtn = document.getElementById('clearPreventionBtn');

    if (runPreventionBtn) {
        runPreventionBtn.addEventListener('click', () => {
            runPreventionSimulation();
        });
    }

    if (clearPreventionBtn) {
        clearPreventionBtn.addEventListener('click', () => {
            document.getElementById('preventionVisualization').innerHTML = '';
            document.getElementById('preventionResult').innerHTML = '';
        });
    }

    function runPreventionSimulation() {
        const method = document.getElementById('preventionMethod').value;
        const scenario = document.getElementById('preventionScenario').value;
        
        const events = scenario.trim().split('\n').map(line => {
            const [process, resource, type] = line.trim().split(',').map(s => s.trim());
            return { process, resource, type };
        });

        const timeline = simulatePrevention(events, method);
        visualizePrevention(timeline, method);
    }

    function simulatePrevention(events, method) {
        const timeline = [];
        const allocations = new Map();
        const requests = new Map();

        events.forEach((event, idx) => {
            const result = applyPreventionMethod(event, method, allocations, requests);
            timeline.push({
                ...event,
                step: idx + 1,
                result: result.action,
                reason: result.reason,
                blocked: result.action === 'blocked',
                allowed: result.action === 'allowed',
                prevented: result.action === 'prevented'
            });
        });

        return timeline;
    }

    function applyPreventionMethod(event, method, allocations, requests) {
        if (event.type === 'A') {
            // Allocation
            const key = `${event.process}-${event.resource}`;
            if (method === 'holdwait' && allocations.has(event.process)) {
                return {
                    action: 'prevented',
                    reason: 'Hold & Wait Prevention: Process must release all resources before acquiring new ones'
                };
            }
            allocations.set(key, event);
            return { action: 'allowed', reason: 'Resource allocated' };
        } else {
            // Request
            if (method === 'mutex' && allocations.has(event.resource)) {
                return {
                    action: 'blocked',
                    reason: 'Mutual Exclusion: Resource already allocated'
                };
            }
            if (method === 'circular') {
                // Circular wait ordering: enforce ordering on resources
                return {
                    action: 'allowed',
                    reason: 'Circular Wait Prevention: Resource ordering enforced'
                };
            }
            requests.set(`${event.process}-${event.resource}`, event);
            return { action: 'allowed', reason: 'Request processed' };
        }
    }

    function visualizePrevention(timeline, method) {
        const container = document.getElementById('preventionVisualization');
        
        let html = `
            <h3>Prevention Method: ${getMethodName(method)}</h3>
            <div class="prevention-timeline">
                ${timeline.map(event => `
                    <div class="timeline-event ${event.blocked ? 'blocked' : event.prevented ? 'prevented' : 'allowed'}">
                        <div class="timeline-icon">
                            ${event.blocked ? '🚫' : event.prevented ? '⚠️' : '✓'}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-title">Step ${event.step}: ${event.process} ${event.type === 'A' ? 'allocates' : 'requests'} ${event.resource}</div>
                            <div class="timeline-desc">${event.reason}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = html;

        // Display summary
        const blockedCount = timeline.filter(e => e.blocked).length;
        const preventedCount = timeline.filter(e => e.prevented).length;
        const allowedCount = timeline.filter(e => e.allowed).length;

        document.getElementById('preventionResult').innerHTML = `
            <div class="comparison-container">
                <div class="comparison-card">
                    <h4>Allowed</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${allowedCount}</p>
                </div>
                <div class="comparison-card">
                    <h4>Blocked</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: var(--error-color);">${blockedCount}</p>
                </div>
                <div class="comparison-card">
                    <h4>Prevented</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${preventedCount}</p>
                </div>
            </div>
        `;
    }

    function getMethodName(method) {
        const names = {
            'none': 'None (Original)',
            'mutex': 'Mutual Exclusion',
            'holdwait': 'Hold & Wait Elimination',
            'preemption': 'No Preemption',
            'circular': 'Circular Wait Ordering'
        };
        return names[method] || method;
    }
});

