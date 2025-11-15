// Live CPU Scheduling Visualizer
class Process {
    constructor(name, arrival, burst, priority = 0) {
        this.name = name;
        this.arrival = arrival;
        this.burst = burst;
        this.remaining = burst;
        this.basePriority = priority;
        this.dynamicPriority = priority;
        this.start = -1;
        this.finish = 0;
        this.turnaround = 0;
        this.waiting = 0;
        this.completed = false;
    }

    reset() {
        this.remaining = this.burst;
        this.start = -1;
        this.finish = 0;
        this.turnaround = 0;
        this.waiting = 0;
        this.completed = false;
    }
}

class CPUScheduler {
    constructor() {
        this.processes = [];
        this.results = {};
    }

    setProcesses(processData) {
        this.processes = processData.map(p => new Process(p.name, p.arrival, p.burst, p.priority ?? 0));
    }

    // First Come First Serve
    fcfs() {
        const processes = this.processes.map(p => { p.reset(); return p; });
        const timeline = [];
        const sortedProcesses = [...processes].sort((a, b) => a.arrival - b.arrival);
        
        let currentTime = 0;
        
        for (const process of sortedProcesses) {
            // Handle idle time
            while (currentTime < process.arrival) {
                timeline.push(' ');
                currentTime++;
            }
            
            // Execute process
            if (process.start === -1) process.start = currentTime;
            
            for (let i = 0; i < process.burst; i++) {
                timeline.push(process.name);
                currentTime++;
            }
            
            process.finish = currentTime;
            process.turnaround = process.finish - process.arrival;
            process.waiting = process.turnaround - process.burst;
            process.completed = true;
        }
        
        return {
            name: 'FCFS (First Come First Serve)',
            timeline: timeline,
            processes: sortedProcesses,
            stats: this.calculateStats(sortedProcesses, timeline)
        };
    }

    // Round Robin
    roundRobin(quantum = 3) {
        const processes = this.processes.map(p => { p.reset(); return p; });
        const timeline = [];
        const queue = [];
        const added = new Set();
        
        let currentTime = 0;
        const maxTime = Math.max(50, processes.reduce((sum, p) => sum + p.burst, 0) * 2);
        
        while (currentTime < maxTime && processes.some(p => !p.completed)) {
            // Add new arrivals to queue
            for (const process of processes) {
                if (process.arrival <= currentTime && !added.has(process.name) && !process.completed) {
                    queue.push(process);
                    added.add(process.name);
                }
            }
            
            if (queue.length === 0) {
                timeline.push(' ');
                currentTime++;
                continue;
            }
            
            const currentProcess = queue.shift();
            if (currentProcess.start === -1) currentProcess.start = currentTime;
            
            const executeTime = Math.min(quantum, currentProcess.remaining);
            
            for (let i = 0; i < executeTime; i++) {
                timeline.push(currentProcess.name);
                currentTime++;
            }
            
            currentProcess.remaining -= executeTime;
            
            // Add new arrivals that came during execution
            for (const process of processes) {
                if (process.arrival <= currentTime && !added.has(process.name) && !process.completed) {
                    queue.push(process);
                    added.add(process.name);
                }
            }
            
            if (currentProcess.remaining > 0) {
                queue.push(currentProcess);
            } else {
                currentProcess.finish = currentTime;
                currentProcess.turnaround = currentProcess.finish - currentProcess.arrival;
                currentProcess.waiting = currentProcess.turnaround - currentProcess.burst;
                currentProcess.completed = true;
            }
        }
        
        return {
            name: `Round Robin (Quantum = ${quantum})`,
            timeline: timeline,
            processes: processes,
            stats: this.calculateStats(processes, timeline)
        };
    }

    // Shortest Process Next
    spn() {
        const processes = this.processes.map(p => { p.reset(); return p; });
        const timeline = [];
        const completed = new Set();
        
        let currentTime = 0;
        
        while (completed.size < processes.length) {
            const available = processes.filter(p => 
                p.arrival <= currentTime && !completed.has(p.name)
            );
            
            if (available.length === 0) {
                timeline.push(' ');
                currentTime++;
                continue;
            }
            
            // Select shortest process
            const shortest = available.reduce((min, p) => 
                p.burst < min.burst ? p : min
            );
            
            if (shortest.start === -1) shortest.start = currentTime;
            
            for (let i = 0; i < shortest.burst; i++) {
                timeline.push(shortest.name);
                currentTime++;
            }
            
            shortest.finish = currentTime;
            shortest.turnaround = shortest.finish - shortest.arrival;
            shortest.waiting = shortest.turnaround - shortest.burst;
            shortest.completed = true;
            completed.add(shortest.name);
        }
        
        return {
            name: 'SPN (Shortest Process Next)',
            timeline: timeline,
            processes: processes,
            stats: this.calculateStats(processes, timeline)
        };
    }

    // Shortest Remaining Time
    srt() {
        const processes = this.processes.map(p => { p.reset(); return p; });
        const timeline = [];
        const completed = new Set();
        
        let currentTime = 0;
        const maxTime = processes.reduce((sum, p) => sum + p.burst, 0) + 
                       Math.max(...processes.map(p => p.arrival));
        
        while (currentTime < maxTime && completed.size < processes.length) {
            const available = processes.filter(p => 
                p.arrival <= currentTime && !completed.has(p.name)
            );
            
            if (available.length === 0) {
                timeline.push(' ');
                currentTime++;
                continue;
            }
            
            // Select process with shortest remaining time
            const shortest = available.reduce((min, p) => 
                p.remaining < min.remaining ? p : min
            );
            
            if (shortest.start === -1) shortest.start = currentTime;
            
            timeline.push(shortest.name);
            shortest.remaining--;
            currentTime++;
            
            if (shortest.remaining === 0) {
                shortest.finish = currentTime;
                shortest.turnaround = shortest.finish - shortest.arrival;
                shortest.waiting = shortest.turnaround - shortest.burst;
                shortest.completed = true;
                completed.add(shortest.name);
            }
        }
        
        return {
            name: 'SRT (Shortest Remaining Time)',
            timeline: timeline,
            processes: processes,
            stats: this.calculateStats(processes, timeline)
        };
    }

    // Highest Response Ratio Next
    hrrn() {
        const processes = this.processes.map(p => { p.reset(); return p; });
        const timeline = [];
        const completed = new Set();
        
        let currentTime = 0;
        
        while (completed.size < processes.length) {
            const available = processes.filter(p => 
                p.arrival <= currentTime && !completed.has(p.name)
            );
            
            if (available.length === 0) {
                timeline.push(' ');
                currentTime++;
                continue;
            }
            
            // Calculate response ratios and select highest
            const withRatio = available.map(p => ({
                process: p,
                ratio: 1 + (currentTime - p.arrival) / p.burst
            }));
            
            const highest = withRatio.reduce((max, current) => 
                current.ratio > max.ratio ? current : max
            );
            
            const selected = highest.process;
            
            if (selected.start === -1) selected.start = currentTime;
            
            for (let i = 0; i < selected.burst; i++) {
                timeline.push(selected.name);
                currentTime++;
            }
            
            selected.finish = currentTime;
            selected.turnaround = selected.finish - selected.arrival;
            selected.waiting = selected.turnaround - selected.burst;
            selected.completed = true;
            completed.add(selected.name);
        }
        
        return {
            name: 'HRRN (Highest Response Ratio Next)',
            timeline: timeline,
            processes: processes,
            stats: this.calculateStats(processes, timeline)
        };
    }

    // Priority preemptive with aging and optional context switch overhead
    priorityPreemptive(agingRate = 1, contextSwitchOverhead = 0) {
        const processes = this.processes.map(p => { p.reset(); p.dynamicPriority = p.basePriority; return p; });
        const timeline = [];
        const completed = new Set();

        let currentTime = 0;
        let lastProcess = null;
        const maxTime = processes.reduce((sum, p) => sum + p.burst, 0) + Math.max(...processes.map(p => p.arrival));

        while (currentTime < maxTime && completed.size < processes.length) {
            // Aging: increase priority of all ready & waiting processes
            processes.forEach(p => {
                if (!p.completed && p.arrival <= currentTime && p !== lastProcess) {
                    p.dynamicPriority += agingRate;
                }
            });

            const available = processes.filter(p => p.arrival <= currentTime && !completed.has(p.name));
            if (available.length === 0) {
                timeline.push(' ');
                currentTime++;
                continue;
            }

            // Select highest priority (larger value means higher priority)
            const selected = available.reduce((best, p) => p.dynamicPriority > best.dynamicPriority ? p : best);

            // Context switch overhead if switching processes
            if (lastProcess && lastProcess !== selected && contextSwitchOverhead > 0) {
                for (let i = 0; i < contextSwitchOverhead; i++) {
                    timeline.push(' ');
                    currentTime++;
                }
            }

            if (selected.start === -1) selected.start = currentTime;
            // Run for 1 tick (preemptive)
            selected.dynamicPriority = selected.basePriority; // reset on run
            timeline.push(selected.name);
            selected.remaining--;
            currentTime++;
            lastProcess = selected;

            if (selected.remaining === 0) {
                selected.finish = currentTime;
                selected.turnaround = selected.finish - selected.arrival;
                selected.waiting = selected.turnaround - selected.burst;
                selected.completed = true;
                completed.add(selected.name);
            }
        }

        return {
            name: `Priority (Preemptive + Aging)` ,
            timeline: timeline,
            processes: processes,
            stats: this.calculateStats(processes, timeline)
        };
    }

    calculateStats(processes, timeline) {
        const completed = processes.filter(p => p.completed);
        if (completed.length === 0) return null;
        
        const totalTAT = completed.reduce((sum, p) => sum + p.turnaround, 0);
        const totalWT = completed.reduce((sum, p) => sum + p.waiting, 0);
        const cpuTime = timeline.filter(slot => slot !== ' ').length;
        const utilization = (cpuTime / timeline.length) * 100;
        
        return {
            avgTurnaround: totalTAT / completed.length,
            avgWaiting: totalWT / completed.length,
            cpuUtilization: utilization,
            totalProcesses: completed.length
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Advanced CPU Scheduler initialized');

    const scheduler = new CPUScheduler();
    const runBtn = document.getElementById('runBtn');
    const stepBtn = document.getElementById('stepBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const resultsDiv = document.getElementById('results');
    const outputDiv = document.getElementById('output');
    const comparisonDiv = document.getElementById('comparison');
    const comparisonTableDiv = document.getElementById('comparisonTable');
    const algorithmInfo = document.getElementById('algorithmInfo');
    const infoContent = document.getElementById('infoContent');
    const visualizationPanel = document.getElementById('visualizationPanel');
    const cpuCores = document.getElementById('cpuCores');
    const processQueue = document.getElementById('processQueue');
    const particles = document.getElementById('particles');

    // Global state
    let isRunning = false;
    let isPaused = false;
    let currentStep = 0;
    let stepInterval = null;
    let currentResults = [];

    // Verify all elements are found
    function applyTheme(theme) {
        const icon = themeToggle?.querySelector('i');
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

    const savedTheme = localStorage.getItem('os-visualizer-theme') || 'light';
    applyTheme(savedTheme);
    
    if (!runBtn || !clearBtn || !resultsDiv || !outputDiv) {
        console.error('Required DOM elements not found');
        return;
    }

    // Event listeners
    runBtn.addEventListener('click', runSimulation);
    stepBtn.addEventListener('click', runStepByStep);
    pauseBtn.addEventListener('click', pauseSimulation);
    exportBtn.addEventListener('click', exportResults);
    clearBtn.addEventListener('click', clearResults);
    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('os-visualizer-theme', newTheme);
    });

    // Deadlock analyzer events
    const runDeadlockBtn = document.getElementById('runDeadlock');
    const dlTotal = document.getElementById('dlTotal');
    const dlAvailable = document.getElementById('dlAvailable');
    const dlMax = document.getElementById('dlMax');
    const dlAlloc = document.getElementById('dlAlloc');
    const dlResult = document.getElementById('deadlockResult');

    if (runDeadlockBtn) {
        runDeadlockBtn.addEventListener('click', () => {
            try {
                const total = parseVector(dlTotal.value);
                const available = parseVector(dlAvailable.value);
                const max = parseMatrix(dlMax.value);
                const alloc = parseMatrix(dlAlloc.value);
                const analysis = bankersSafetyCheck(available, max, alloc);
                renderDeadlockResult(analysis);
            } catch (e) {
                dlResult.innerHTML = `<div class="unsafe-state">${e.message}</div>`;
            }
        });
    }

    // Initialize particles
    createParticles();

    // Algorithm information
    const algorithmInfoData = {
        '1': {
            name: 'FCFS (First Come First Serve)',
            description: 'Processes are executed in the order they arrive. Simple but can cause convoy effect.',
            complexity: 'O(n)',
            advantages: ['Simple to implement', 'No starvation', 'Fair scheduling'],
            disadvantages: ['Poor average waiting time', 'Convoy effect', 'Not optimal for short processes']
        },
        '2': {
            name: 'Round Robin',
            description: 'Each process gets a fixed time slice (quantum). Preemptive scheduling.',
            complexity: 'O(n)',
            advantages: ['Fair to all processes', 'Good response time', 'No starvation'],
            disadvantages: ['Context switching overhead', 'Performance depends on quantum size']
        },
        '3': {
            name: 'SPN (Shortest Process Next)',
            description: 'Processes with shortest burst time are executed first. Non-preemptive.',
            complexity: 'O(n²)',
            advantages: ['Optimal average waiting time', 'Minimal average turnaround time'],
            disadvantages: ['Starvation of long processes', 'Difficult to predict burst time']
        },
        '4': {
            name: 'SRT (Shortest Remaining Time)',
            description: 'Preemptive version of SPN. Process with shortest remaining time runs.',
            complexity: 'O(n²)',
            advantages: ['Better than SPN', 'Optimal for short processes'],
            disadvantages: ['Complex implementation', 'Starvation possible', 'Context switching overhead']
        },
        '5': {
            name: 'HRRN (Highest Response Ratio Next)',
            description: 'Scheduling based on response ratio = (waiting time + burst time) / burst time.',
            complexity: 'O(n²)',
            advantages: ['No starvation', 'Considers both waiting and burst time'],
            disadvantages: ['Complex calculation', 'Not optimal for all cases']
        },
        '6': {
            name: 'Priority (Preemptive + Aging)',
            description: 'Preemptive priority scheduling with dynamic aging to prevent starvation. Optional context switch overhead included.',
            complexity: 'O(n²) naive (select each tick)',
            advantages: ['Respects priorities', 'Aging mitigates starvation', 'Preemptive responsiveness'],
            disadvantages: ['Frequent preemptions', 'Needs careful parameter tuning']
        }
    };
    
    function runSimulation() {
        try {
            // Parse input data
            const processData = parseProcessData();
            if (processData.length === 0) {
                alert('Please enter valid process data');
                return;
            }
            
            scheduler.setProcesses(processData);
            
            // Get selected algorithms
            const selectedAlgorithms = getSelectedAlgorithms();
            if (selectedAlgorithms.length === 0) {
                alert('Please select at least one algorithm');
                return;
            }
            
            // Run simulations
            const results = [];
            const quantum = parseInt(document.getElementById('quantum').value) || 3;
            const agingRate = parseInt(document.getElementById('agingRate').value) || 0;
            const ctxOverhead = parseInt(document.getElementById('ctxOverhead').value) || 0;
            
            selectedAlgorithms.forEach(algo => {
                let result;
                switch(algo) {
                    case '1': result = scheduler.fcfs(); break;
                    case '2': result = scheduler.roundRobin(quantum); break;
                    case '3': result = scheduler.spn(); break;
                    case '4': result = scheduler.srt(); break;
                    case '5': result = scheduler.hrrn(); break;
                    case '6': result = scheduler.priorityPreemptive(agingRate, ctxOverhead); break;
                }
                if (result) results.push(result);
            });
            
            // Store results for export
            currentResults = results;
            
            // Display results
            displayResults(results);
            displayComparison(results);
            
            // Show algorithm information for first algorithm
            if (results.length > 0) {
                displayAlgorithmInfo(results[0].name);
            }
            
        } catch (error) {
            alert('Error running simulation: ' + error.message);
        }
    }
    
    function parseProcessData() {
        const data = document.getElementById('processData').value.trim();
        if (!data) return [];
        
        return data.split('\n').map(line => {
            const parts = line.trim().split(',');
            if (parts.length < 3 || parts.length > 4) throw new Error('Invalid process data format');
            
            return {
                name: parts[0].trim(),
                arrival: parseInt(parts[1].trim()),
                burst: parseInt(parts[2].trim()),
                priority: parts[3] !== undefined ? parseInt(parts[3].trim()) : 0
            };
        }).filter(p => p.name && !isNaN(p.arrival) && !isNaN(p.burst));
    }
    
    function getSelectedAlgorithms() {
        const checkboxes = document.querySelectorAll('.algorithm-checkboxes input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
    
    function clearResults() {
        resultsDiv.style.display = 'none';
        comparisonDiv.style.display = 'none';
        algorithmInfo.style.display = 'none';
        visualizationPanel.style.display = 'none';
        outputDiv.innerHTML = '';
        comparisonTableDiv.innerHTML = '';
        processQueue.innerHTML = '';
        cpuCores.querySelector('.cpu-core').className = 'cpu-core';
        isRunning = false;
        isPaused = false;
        currentStep = 0;
        if (stepInterval) {
            clearInterval(stepInterval);
            stepInterval = null;
        }
        updateButtonStates();
    }

    function createParticles() {
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = particle.style.height = Math.random() * 4 + 2 + 'px';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            particles.appendChild(particle);
        }
    }

    function runStepByStep() {
        if (isRunning) return;
        
        const processData = parseProcessData();
        if (processData.length === 0) {
            alert('Please enter valid process data');
            return;
        }

        scheduler.setProcesses(processData);
        const selectedAlgorithms = getSelectedAlgorithms();
        if (selectedAlgorithms.length === 0) {
            alert('Please select at least one algorithm');
            return;
        }

        isRunning = true;
        currentStep = 0;
        currentResults = [];

        // Prepare results for all selected algorithms
        const quantum = parseInt(document.getElementById('quantum').value) || 3;
        const agingRate = parseInt(document.getElementById('agingRate')?.value) || 0;
        const ctxOverhead = parseInt(document.getElementById('ctxOverhead')?.value) || 0;

        const results = [];
        selectedAlgorithms.forEach(algo => {
            let result;
            switch(algo) {
                case '1': result = scheduler.fcfs(); break;
                case '2': result = scheduler.roundRobin(quantum); break;
                case '3': result = scheduler.spn(); break;
                case '4': result = scheduler.srt(); break;
                case '5': result = scheduler.hrrn(); break;
                case '6': result = scheduler.priorityPreemptive(agingRate, ctxOverhead); break;
            }
            if (result) results.push(result);
        });

        currentResults = results;
        startStepThroughAlgorithms(results);
        updateButtonStates();
    }

    function startStepThroughAlgorithms(results) {
        visualizationPanel.style.display = 'block';
        let algoIndex = 0;
        let step = 0;

        const setAlgo = (index) => {
            const res = results[index];
            displayAlgorithmInfo(res.name);
            return res;
        };

        let current = setAlgo(algoIndex);

        if (stepInterval) clearInterval(stepInterval);
        stepInterval = setInterval(() => {
            if (isPaused) return;

            const timeline = current.timeline;
            if (step < timeline.length) {
                updateVisualization(timeline[step], step);
                step++;
                return;
            }

            // Move to next algorithm
            algoIndex++;
            if (algoIndex >= results.length) {
                clearInterval(stepInterval);
                isRunning = false;
                updateButtonStates();
                displayResults(currentResults);
                displayComparison(currentResults);
                return;
            }
            current = setAlgo(algoIndex);
            step = 0;
        }, 800);
    }

    function updateVisualization(processName, timeStep) {
        const cpu = cpuCores.querySelector('.cpu-core');
        
        if (processName === ' ') {
            cpu.className = 'cpu-core idle';
            cpu.textContent = 'IDLE';
        } else {
            cpu.className = 'cpu-core active';
            cpu.textContent = processName;
        }
        
        // Update process queue visualization
        updateProcessQueue(processName, timeStep);
    }

    function updateProcessQueue(processName, timeStep) {
        // This is a simplified version - in a real implementation,
        // you'd track the actual queue state
        if (processName !== ' ') {
            const processItem = document.createElement('div');
            processItem.className = 'process-item executing';
            processItem.textContent = processName;
            processItem.style.animationDelay = '0s';
            processQueue.appendChild(processItem);
            
            // Remove after animation
            setTimeout(() => {
                if (processItem.parentNode) {
                    processItem.classList.remove('executing');
                    processItem.classList.add('completed');
                }
            }, 500);
        }
    }

    function displayAlgorithmInfo(algorithmName) {
        const algorithmId = Object.keys(algorithmInfoData).find(id => 
            algorithmInfoData[id].name.includes(algorithmName.split(' ')[0])
        );
        
        if (algorithmId && algorithmInfoData[algorithmId]) {
            const info = algorithmInfoData[algorithmId];
            infoContent.innerHTML = `
                <div class="info-card">
                    <h4>${info.name}</h4>
                    <p><strong>Description:</strong> ${info.description}</p>
                    <p><strong>Time Complexity:</strong> ${info.complexity}</p>
                    <div class="advantages">
                        <h5>✅ Advantages:</h5>
                        <ul>${info.advantages.map(adv => `<li>${adv}</li>`).join('')}</ul>
                    </div>
                    <div class="disadvantages">
                        <h5>❌ Disadvantages:</h5>
                        <ul>${info.disadvantages.map(dis => `<li>${dis}</li>`).join('')}</ul>
                    </div>
                </div>
            `;
            algorithmInfo.style.display = 'block';
        }
    }

    function pauseSimulation() {
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }

    function exportResults() {
        if (currentResults.length === 0) {
            alert('No results to export');
            return;
        }

        let exportData = '# CPU Scheduling Simulation Results\n\n';
        currentResults.forEach(result => {
            exportData += `## ${result.name}\n\n`;
            exportData += `**Average Turnaround Time:** ${result.stats.avgTurnaround.toFixed(2)}\n`;
            exportData += `**Average Waiting Time:** ${result.stats.avgWaiting.toFixed(2)}\n`;
            exportData += `**CPU Utilization:** ${result.stats.cpuUtilization.toFixed(2)}%\n\n`;
        });

        const blob = new Blob([exportData], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cpu_scheduling_results.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function updateButtonStates() {
        runBtn.disabled = isRunning;
        stepBtn.disabled = isRunning;
        pauseBtn.style.display = isRunning ? 'inline-flex' : 'none';
        
        if (isRunning) {
            runBtn.classList.add('loading');
        } else {
            runBtn.classList.remove('loading');
        }
    }
    
    function displayResults(results) {
        outputDiv.innerHTML = '';

        results.forEach(result => {
            const algorithmDiv = document.createElement('div');
            algorithmDiv.className = 'algorithm-result';

            algorithmDiv.innerHTML = `
                <div class="algorithm-title">${result.name}</div>

                <div class="gantt-chart">${generateGanttChart(result.timeline)}</div>

                <div class="process-table">
                    ${generateProcessTable(result.processes)}
                </div>

                <div class="summary-stats">
                    <h4>📊 Summary Statistics</h4>
                    <div class="stat-item">
                        <span>Average Turnaround Time:</span>
                        <span>${result.stats.avgTurnaround.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Average Waiting Time:</span>
                        <span>${result.stats.avgWaiting.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span>CPU Utilization:</span>
                        <span>${result.stats.cpuUtilization.toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <span>Total Processes:</span>
                        <span>${result.stats.totalProcesses}</span>
                    </div>
                </div>
            `;

            outputDiv.appendChild(algorithmDiv);
        });

        resultsDiv.classList.add('show');
        resultsDiv.style.display = 'block';
    }

    function generateGanttChart(timeline) {
        // Create both ASCII and interactive versions
        const asciiChart = generateASCIIGanttChart(timeline);
        const interactiveChart = generateInteractiveGanttChart(timeline);
        
        return asciiChart + '\n\n' + interactiveChart;
    }

    function generateASCIIGanttChart(timeline) {
        let chart = 'GANTT CHART:\n';
        chart += '─'.repeat(80) + '\n';

        // Time markers (top)
        chart += 'Time: ';
        for (let i = 0; i < Math.min(timeline.length, 30); i++) {
            chart += String(i).padStart(4);
        }
        if (timeline.length > 30) chart += '...';
        chart += '\n';

        // Process execution
        chart += 'Proc: ';
        for (let i = 0; i < Math.min(timeline.length, 30); i++) {
            const slot = timeline[i] === ' ' ? 'IDLE' : timeline[i];
            chart += slot.padStart(4);
        }
        if (timeline.length > 30) chart += '...';
        chart += '\n';

        // Visual boxes
        chart += '      ';
        for (let i = 0; i <= Math.min(timeline.length, 30); i++) {
            chart += '+---';
        }
        chart += '\n';

        chart += '      ';
        for (let i = 0; i < Math.min(timeline.length, 30); i++) {
            const slot = timeline[i] === ' ' ? '   ' : ` ${timeline[i]} `;
            chart += `|${slot.padEnd(3)}`;
        }
        chart += '|\n';

        chart += '      ';
        for (let i = 0; i <= Math.min(timeline.length, 30); i++) {
            chart += '+---';
        }
        chart += '\n';

        // Time markers (bottom)
        chart += '      ';
        for (let i = 0; i <= Math.min(timeline.length, 30); i++) {
            chart += String(i).padStart(4);
        }
        chart += '\n';

        return chart;
    }

    function generateInteractiveGanttChart(timeline) {
        let chart = '<div class="interactive-gantt">';
        chart += '<h4>🎯 Interactive Timeline</h4>';
        chart += '<div class="gantt-timeline">';
        
        for (let i = 0; i < Math.min(timeline.length, 50); i++) {
            const processName = timeline[i];
            const isIdle = processName === ' ';
            const className = isIdle ? 'gantt-block idle' : `gantt-block ${processName.toLowerCase()}`;
            const displayName = isIdle ? 'IDLE' : processName;
            
            chart += `<div class="${className}" title="Time ${i}: ${displayName}">
                ${displayName}
                <div class="gantt-tooltip">Time: ${i}<br>Process: ${displayName}</div>
            </div>`;
        }
        
        if (timeline.length > 50) {
            chart += '<div class="gantt-block" style="background: #95a5a6;">...</div>';
        }
        
        chart += '</div></div>';
        return chart;
    }

    function generateProcessTable(processes) {
        const completed = processes.filter(p => p.completed);

        let table = `
            <table>
                <thead>
                    <tr>
                        <th>Process</th>
                        <th>Arrival</th>
                        <th>Burst</th>
                        <th>Start</th>
                        <th>Finish</th>
                        <th>Turnaround</th>
                        <th>Waiting</th>
                    </tr>
                </thead>
                <tbody>
        `;

        completed.forEach(process => {
            table += `
                <tr>
                    <td>${process.name}</td>
                    <td>${process.arrival}</td>
                    <td>${process.burst}</td>
                    <td>${process.start}</td>
                    <td>${process.finish}</td>
                    <td>${process.turnaround}</td>
                    <td>${process.waiting}</td>
                </tr>
            `;
        });

        table += '</tbody></table>';
        return table;
    }

    function displayComparison(results) {
        if (results.length < 2) {
            comparisonDiv.style.display = 'none';
            return;
        }

        // Find best performers
        const bestTAT = Math.min(...results.map(r => r.stats.avgTurnaround));
        const bestWT = Math.min(...results.map(r => r.stats.avgWaiting));
        const bestUtil = Math.max(...results.map(r => r.stats.cpuUtilization));

        let table = `
            <div class="comparison-table">
                <table>
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Avg Turnaround Time</th>
                            <th>Avg Waiting Time</th>
                            <th>CPU Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(result => {
            const tatClass = result.stats.avgTurnaround === bestTAT ? 'best-performance' : '';
            const wtClass = result.stats.avgWaiting === bestWT ? 'best-performance' : '';
            const utilClass = result.stats.cpuUtilization === bestUtil ? 'best-performance' : '';

            table += `
                <tr>
                    <td><strong>${result.name}</strong></td>
                    <td class="${tatClass}">${result.stats.avgTurnaround.toFixed(2)}</td>
                    <td class="${wtClass}">${result.stats.avgWaiting.toFixed(2)}</td>
                    <td class="${utilClass}">${result.stats.cpuUtilization.toFixed(2)}%</td>
                </tr>
            `;
        });

        table += '</tbody></table></div>';

        comparisonTableDiv.innerHTML = table;
        comparisonDiv.classList.add('show');
        comparisonDiv.style.display = 'block';
    }

    // ===== Deadlock (Banker's) utilities =====
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

    function vectorAdd(a, b) { return a.map((v, i) => v + b[i]); }
    function vectorSub(a, b) { return a.map((v, i) => v - b[i]); }

    function bankersSafetyCheck(available, max, alloc) {
        const n = alloc.length;
        const m = available.length;
        const need = Array.from({ length: n }, (_, i) =>
            Array.from({ length: m }, (_, j) => max[i][j] - alloc[i][j])
        );

        const work = available.slice();
        const finish = Array(n).fill(false);
        const sequence = [];

        let progress = true;
        while (progress) {
            progress = false;
            for (let i = 0; i < n; i++) {
                if (!finish[i] && vectorLeq(need[i], work)) {
                    work.splice(0, m, ...vectorAdd(work, alloc[i]));
                    finish[i] = true;
                    sequence.push(`P${i}`);
                    progress = true;
                }
            }
        }

        const safe = finish.every(f => f);
        return { safe, sequence, need, work };
    }

    function renderDeadlockResult(res) {
        if (res.safe) {
            dlResult.innerHTML = `<div class="safe-sequence"><strong>Safe state.</strong> Safe sequence: ${res.sequence.join(' → ')}</div>`;
        } else {
            dlResult.innerHTML = `<div class="unsafe-state"><strong>Unsafe state.</strong> No complete safe sequence exists. Potential deadlock.</div>`;
        }
    }
});
