# 🖥️ Operating System Visualizer

A comprehensive, interactive web-based learning platform for understanding core Operating System concepts through real-time visualizations and simulations. Experience interactive algorithm simulation directly in your browser with no compilation or installation required.

## 🌟 Features

### 🚀 CPU Scheduling
Visualize and compare multiple CPU scheduling algorithms in real-time:
- **FCFS** (First Come First Serve)
- **Round Robin** with configurable quantum
- **SPN** (Shortest Process Next)
- **SRT** (Shortest Remaining Time)
- **HRRN** (Highest Response Ratio Next)
- **Priority** (Preemptive + Aging)

**Visualizations:**
- Interactive Gantt Charts
- Real-time step-by-step execution
- Performance comparison tables
- Process scheduling tables with detailed metrics

### 🔒 Deadlock Analysis

#### 1. Deadlock Detection
- **Resource Allocation Graph (RAG) Visualization**
  - Dynamic visualization of processes and resources
  - Highlight cycles in red → deadlock detection
  - Step-by-step cycle detection using DFS
  - Visual report of deadlocked processes

#### 2. Deadlock Avoidance
- **Banker's Algorithm**
  - Need matrix calculation
  - Safety sequence animation
  - Safe/Unsafe state detection
  - Step-by-step safety check visualization

#### 3. Deadlock Prevention
- **Prevention Strategies Simulation**
  - Mutual Exclusion
  - Hold & Wait Elimination
  - No Preemption
  - Circular Wait Ordering
  - Visual timeline of prevention effects

## 🚀 Quick Start

1. **Open `index.html`** in any modern web browser
2. Navigate to the desired feature section:
   - **CPU Scheduling**: Compare scheduling algorithms
   - **Deadlock**: Analyze deadlock scenarios
3. Enter your data and click "Run" to see interactive visualizations
4. Use step-by-step mode to understand algorithms in detail

## 📁 Project Structure

```
CPU Schedular/
├── index.html                    # Welcome/Landing page
├── cpu-scheduling.html          # CPU Scheduling visualizer
├── deadlock.html                # Deadlock analysis tools
├── README.md                    # This file
└── assets/
    ├── css/
    │   ├── style.css           # Main shared styles
    │   ├── welcome.css         # Welcome page styles
    │   ├── deadlock.css        # Deadlock page styles
    └── js/
        ├── welcome.js          # Welcome page logic
        ├── live-scheduler.js   # CPU Scheduling algorithms
        ├── deadlock.js         # Deadlock analysis algorithms
```

## 🎯 Usage Guide

### CPU Scheduling

1. Select the algorithms you want to compare
2. Set Round Robin quantum (if selected)
3. Enter process data: `name,arrival,burst[,priority]`
   ```
   P1,0,6
   P2,1,4
   P3,2,2
   ```
4. Click "Run Live Simulation"
5. View interactive Gantt charts and performance metrics

### Deadlock Detection

1. Enter number of processes and resources
2. Specify resource instances
3. Define allocation and request matrices
4. Click "Detect Deadlock" to visualize RAG and find cycles
5. View deadlocked processes highlighted in red

### Deadlock Avoidance (Banker's Algorithm)

1. Enter total resource vector (e.g., `10,5,7`)
2. Enter available resource vector (e.g., `3,3,2`)
3. Define Max and Allocation matrices
4. Run Banker's Algorithm to find safe sequence
5. View step-by-step safety check

## 🎨 UI Features

- **Modern Design**: Beautiful, responsive interface with smooth animations
- **Dark Mode**: Toggle between light and dark themes
- **Interactive Visualizations**: Hover effects, tooltips, and dynamic updates
- **Step-by-Step Mode**: Watch algorithms execute in real-time
- **Performance Comparison**: Side-by-side algorithm analysis
- **Export Results**: Download simulation results
- **Responsive Layout**: Works on desktop, tablet, and mobile

## 🌐 Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## 📊 Sample Data

### CPU Scheduling
```
P1,0,6
P2,1,4
P3,2,2
P4,3,3
P5,5,1
```

### Deadlock Detection
**Allocation Edges:**
```
P1,R1
P2,R2
P3,R3
```

**Request Edges:**
```
P1,R2
P2,R3
P3,R1
```

### Banker's Algorithm
**Total:** `10,5,7`
**Available:** `3,3,2`
**Max:**
```
7,5,3
3,2,2
9,0,2
```
**Allocation:**
```
0,1,0
2,0,0
3,0,2
```

## 🛠️ Technical Details

- **Pure JavaScript** - No frameworks or dependencies
- **CSS3 Animations** - Smooth visual effects
- **Responsive Design** - Mobile-first approach
- **Local Processing** - All calculations done in browser (no server required)
- **Modular Architecture** - Separate modules for each feature

## 📝 Educational Value

This platform is designed specifically for:
- **Students** learning operating systems concepts
- **Educators** teaching OS principles
- **Developers** understanding system internals
- **Anyone** interested in how operating systems work

## 🎓 Learning Outcomes

After using this visualizer, you'll understand:
- How different CPU scheduling algorithms work and compare
- Deadlock detection, avoidance, and prevention strategies
- The trade-offs between different OS strategies

## 📝 License

This project is open source and available for educational purposes.

---

**Made with ❤️ for understanding Operating Systems**

**Enjoy learning! 🚀**
