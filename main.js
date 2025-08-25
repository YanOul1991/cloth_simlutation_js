/* HTML ELEMENTS REFERENCES */
const runtimeDisplay = document.querySelector(".display.runtime");
const fpsDisplay = document.querySelector(".display.fps");

/* ''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''' */
/* ''''''''''''''''''''''''''''' Classes ''''''''''''''''''''''''''''' */

// Class : Canavs
//      This class handles the canvas setup, including dimensions and context.
class Canavs {
    constructor(width = 1500, height = 750) {
        this.main = document.querySelector("canvas");
        this.main.width = width * window.devicePixelRatio || 1;
        this.main.height = height * window.devicePixelRatio || 1;
        this.context = this.main.getContext("2d");
        this.center = {
            x: this.main.width / 2,
            y: this.main.height / 2
        }
    }
    clear() {
        this.context.clearRect(0, 0, this.main.width, this.main.height);
    }
}

// Class : Mouse
//      This class handles the mouse position and radius for interaction with the canvas.
class Mouse {
    constructor(radius = 10, cutRadius = 5) {
        this.position = {
            x: 0,
            y: 0
        }
        this.radius = radius;
        this.cutRadius = cutRadius; // Radius for cutting
        this.cutting = false; // Flag to indicate if cutting is active
        // this.isDown = false;
        this.selectedVerts = [];
        this.selectionOffsets = [];
    }

    updatePosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
}

// Class : Time
//      This class handles the timing for the simulation, including frame count, runtime, and delta time.
class Time {
    frame = 0;
    runtime = 0;
    deltaTime = 0;
    intervalRunTime = {
        currentTime: 0,
        duration: 10
    }

    update() {
        const currentFrame = performance.now();
        this.deltaTime = (currentFrame - this.frame) / 1000; // Convert to seconds
        this.frame = currentFrame;
        this.runtime += this.deltaTime;
        this.currentTime += this.deltaTime;
        // Reset the interval
        if (this.intervalRunTime.currentTime > this.intervalRunTime.duration) {
            this.intervalRunTime.currentTime = 0;
        }
    }
}


// Class : Rectangle
class RectangleMesh {
    constructor(posX, posY, width, height, cuts) {
        this.position = {
            x: posX,
            y: posY,
            prevX: posX,
            prevY: posY,
        }

        this.width = width;
        this.height = height;
        this.precision = cuts;

        let cols = 2 + cuts;
        let rows = 2 + cuts;

        let colsDist = this.width / (cols - 1);
        let rowDist = this.height / (rows - 1);

        this.vertex = [];
        this.edges = [];
        this.fixedVerts = [];

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let vert = new Vertex(i * colsDist + posX, j * rowDist + posY, 50);
                this.vertex.push(vert);
                // this.verts.setValue(i, j, vert);
            }
        }

        for (let i = 0; i < this.vertex.length; i++) {
            const vert = this.vertex[i];

            // top
            if (i % cols > 0) {
                // this.vertex[i].neighbors.push(this.vertex[i - 1]);
            }
            else {
                vert.isFixed = true;
                this.fixedVerts.push(vert);
            }

            // Bottom
            if (i % cols < rows - 1) {
                const nEdge = new Edge(this.vertex[i], this.vertex[i + 1])
                this.edges.push(nEdge);
                this.vertex[i].edges.push(nEdge);
            }
            else {
                if (vert.isFixed) {
                    continue; // Skip fixed vertices
                }

                // gix vert ?
                if (false) {
                    vert.isFixed = true; // Bottommost vertices are fixed
                    this.fixedVerts.push(vert);
                }
            }

            // Right
            if (i < this.vertex.length - rows) {
                // this.vertex[i].neighbors.push(this.vertex[i + rows]);
                const nEdge = new Edge(this.vertex[i], this.vertex[i + rows]);
                this.edges.push(nEdge);
                this.vertex[i].edges.push(nEdge);
            }
            else {
                if (vert.isFixed) {
                    continue; // Skip fixed vertices
                }

                // fix verts ?
                if (false) {
                    vert.isFixed = true; // Rightmost vertices are fixed
                    this.fixedVerts.push(this.vertex[i]);
                }
            }

            // Left
            if (i <= rows - 1) {
                if (vert.isFixed) {
                    continue; // Skip fixed vertices
                }

                // Fix verts ?
                if (false) {
                    vert.isFixed = true; // Leftmost vertices are fixed
                    this.fixedVerts.push(this.vertex[i]);
                }
            }

            // // Bottom-right
            // if (i % cols < rows - 1 && i < this.vertex.length - rows) {
            //     // this.vertex[i].neighbors.push(this.vertex[(i + 1) + cols]);
            //     const nEdge = new Edge(this.vertex[i], this.vertex[(i + 1) + cols]);
            //     this.edges.push(nEdge);
            //     this.vertex[i].edges.push(nEdge);
            // }
        }

        // fix the cloth ?
        if (false) {
            this.vertex[0].isFixed = true; // Top-left vertex is fixed
            this.vertex[this.vertex.length - rows].isFixed = true; // Top-right vertex is fixed
            this.vertex[this.vertex.length - (cols / 2 * rows)].isFixed = true;
        }
        else {
            for (let i = 0; i < this.fixedVerts.length; i++) {
                if (i % 1 === 0) {
                    this.fixedVerts[i].isFixed = true;
                }
            }
        }
            console.log(`Vertices: ${this.vertex.length}, Edges: ${this.edges.length}`);
        }
    }

/* Vertex class */
class Vertex {
    constructor(x, y, mass, isFixed = false) {
        this.x = x;
        this.y = y;
        this.isFixed = isFixed;
        this.mass = mass;
        this.lastX = x;
        this.lastY = y;
        this.neighbors = [];
        this.edges = [];
        this.isSelected = false; // Add a property to track selection state
    }
}

class Edge {
    constructor(vert1, vert2) {
        this.vert1 = vert1;
        this.vert2 = vert2;
        this.length = getDistance(this.vert1, this.vert2) * 1; // Set the equilibrium distance to half the initial distance
    }

    applyConstraint() {
        const diff = getDifference(this.vert1, this.vert2);
        const currentLength = getLength(diff);
        const slack = 0.01; // Slack factor to allow some stretch
        const strech = {
            min: this.length * (1 - slack),
            max: this.length * (1 + slack)
        };

        if (currentLength < strech.min || currentLength > strech.max) {
            const diffFactor = ((this.length - currentLength) / currentLength);
            const offset = {
                x: diff.x * diffFactor * 0.5,
                y: diff.y * diffFactor * 0.5,
            }
            this.vert1.x += this.vert1.isFixed ? 0 : offset.x;
            this.vert1.y += this.vert1.isFixed ? 0 : offset.y;
            this.vert2.x -= this.vert2.isFixed ? 0 : offset.x;
            this.vert2.y -= this.vert2.isFixed ? 0 : offset.y;
        }
        // Debugging output
        if (false) {
            console.log(`\nEquilibrium Distance: ${this.length}`);
            console.log(`Real Distance: ${getLength(diff)}`);
            console.log(`Axis Difference: ${diff.x}, ${diff.y}`);
            console.log(`Difference Factor: ${diffFactor}`);
            console.log(`Offset: ${offset.x}, ${offset.y}`);
        }

        // ==================================================================================
        // Spring force calculation (Hooke's Law) ===========================================

        // F = -k * (x - x0)
        // where : 
        //      F: Force applied by the spring
        //      k: Spring constant (stiffness, higher value means stiffer spring)
        //      x: Current length of the spring
        //     x0: Equilibrium length of the spring (aka: desired length)

        // const v2 = getDifference(this.vert1, this.vert2);
        // const l = getLength(v2);
        // if (l === 0) return; // Prevent division by zero
        // const k = 0.1; // Spring constant (stiffness)
        // const force = -k * (l - this.length);
        // const fx = (v2.x / l) * force; // Force in the x direction
        // const fy = (v2.y / l) * force; // Force in the y direction

        // // Apply the force to the vertices
        // this.vert1.x += this.vert1.isFixed ? 0 : fx;
        // this.vert1.y += this.vert1.isFixed ? 0 : fy;
        // this.vert2.x -= this.vert2.isFixed ? 0 : fx;
        // this.vert2.y -= this.vert2.isFixed ? 0 : fy;
    }
}

// Class : Matrix
class Matrix {
    constructor(cols, rows) {
        this.data = Array(cols).fill().map(() => Array(rows).fill(null));
        this.cols = cols;
        this.rows = rows;
    }
    getValue(col, row) {
        return this.data[col][row];
    }
    setValue(col, row, value) {
        this.data[col][row] = value;
    }
}
/* ''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''' */
/* ''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''' */

/* ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; */
/* ;;;;;;;;;;;;;;;;;;;;;;;; Utilities ;;;;;;;;;;;;;;;;;;;;;;;; */
function getDistance(vert1, vert2) {
    let dx = vert1.x - vert2.x;
    let dy = vert1.y - vert2.y;
    return Math.sqrt((dx * dx) + (dy * dy));
}

function getLength(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}

function getDifference(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
/* ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; */
/* ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; */


//////////////////////////////////////////////////////////////////////// INITIALIZATIONS
const canvas = new Canavs();

let rect = new RectangleMesh(canvas.center.x - (500 / 2), 20, 500, 500, 30);

const mouse = new Mouse(50, 10);
canvas.main.addEventListener("mousemove", (evt) => {
    const c = canvas.main.getBoundingClientRect();
    mouse.updatePosition((evt.clientX - c.left) * (canvas.main.width / c.width), (evt.clientY - c.top) * (canvas.main.height / c.height));
    if (mouse.cutting) {
        for (let i = 0; i < rect.vertex.length; i++) {
            const vert = rect.vertex[i];
            if (getDistance(vert, mouse.position) < mouse.cutRadius) {
                // Remove the vertex and its edges
                rect.vertex.splice(i, 1);
                rect.edges = rect.edges.filter(edge => edge.vert1 !== vert && edge.vert2 !== vert);
                i--; // Adjust index after removal
            }
        }
    }
    // console.log(mouse.position.x.toFixed(0), mouse.position.y.toFixed(0));
});

canvas.main.addEventListener("contextmenu", (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing
});

canvas.main.addEventListener("mousedown", (event) => {
    event.preventDefault();

    if (event.button === 0) {
        for (let i = 0; i < rect.vertex.length; i++) {
            const vert = rect.vertex[i];
            if (vert.isFixed) {
                continue; // Skip fixed vertices
            }

            if (getDistance(vert, mouse.position) < mouse.radius) {
                vert.isSelected = true; // Select the vertex if within mouse radius
                mouse.selectedVerts.push(vert);
                mouse.selectionOffsets.push({
                    x: vert.x - mouse.position.x,
                    y: vert.y - mouse.position.y
                });
            }
        }
    }

    if (event.button === 2) {
        mouse.cutting = true; // Set cutting flag to true on right click
    }
});

document.addEventListener("keydown", (event) => {
    console.log(`Key pressed: ${event.key}`);
    if (event.key === "ArrowLeft") {
        for (const fixedVert of rect.fixedVerts) {
            fixedVert.x -= 500 * time.deltaTime; // Move fixed vertices left
        }
    }
    if (event.key === "ArrowRight") {
        for (const fixedVert of rect.fixedVerts) {
            fixedVert.x += 500 * time.deltaTime; // Move fixed vertices right
        }
    }
    if (event.key === "ArrowUp") {
        for (const fixedVert of rect.fixedVerts) {
            fixedVert.y -= 500 * time.deltaTime; // Move fixed vertices up
        }
    }
    if (event.key === "ArrowDown") {
        for (const fixedVert of rect.fixedVerts) {
            fixedVert.y += 500 * time.deltaTime; // Move fixed vertices down
        }
    }
});

canvas.main.addEventListener("mouseup", (event) => {
    mouse.selectedVerts.forEach(vert => {
        vert.isSelected = false; // Deselect the vertex on mouse up
    });
    mouse.selectedVerts = []; // Clear selected vertices on mouse up
    mouse.selectionOffsets = []; // Clear selection offsets
    mouse.cutting = false; // Reset cutting flag
});

const time = new Time();


// Update function
function update() {
    // Update runtime and framerate displays
    runtimeDisplay.innerHTML = `Runtime ${(time.runtime).toFixed(0)}s`;
    fpsDisplay.innerHTML = `Framerate ${(1 / time.deltaTime).toFixed(0)}`

    // Update vertices
    for (let i = 0; i < rect.vertex.length; i++) {
        const vert = rect.vertex[i];

        if (vert.isFixed) {
            continue; // Skip fixed vertices
        }

        const GravityForce = {
            x: 0,
            y: (9.8 * 500) * vert.mass // Gravity force proportional to mass
        }

        // Wind force
        const WIND = {
            VX: 500000, // Wind force proportional to mass
            VY: 500000, // Wind force proportional to mass
            FREQ: 20,
            PH: i * 0.01 // Phase shift based on vertex position
        }

        // Random gust factor to simulate wind variability
        // const WIND_GUST = Math.sin(time.runtime / 4); 
        const WIND_GUST = 1;

        // Horizontal and vertical wind force
        const WindForce = {
            // x: (WIND.VX * WIND_GUST) + Math.sin(time.runtime * WIND.FREQ + WIND.PH) * WIND_GUST, 
            // y: -WIND.VY * Math.sin(time.runtime * WIND.FREQ + WIND.PH) * WIND_GUST
            x: 0, 
            y: 0
        }

        const acceleration = {
            x: (GravityForce.x + WindForce.x) / vert.mass,
            y: (GravityForce.y + WindForce.y) / vert.mass
        }

        const lastPosition = {
            x: vert.x,
            y: vert.y
        }

        vert.x += (vert.x - vert.lastX) * 0.9 + acceleration.x * time.deltaTime * time.deltaTime;
        vert.y += (vert.y - vert.lastY) * 0.9 + acceleration.y * time.deltaTime * time.deltaTime

        if (vert.y > canvas.main.height) {
            vert.y = canvas.main.height; // Reset position if below canvas
        }

        vert.lastX = lastPosition.x;
        vert.lastY = lastPosition.y;

        for (let i = 0; i < mouse.selectedVerts.length; i++) {
            const vert = mouse.selectedVerts[i];
            const offset = mouse.selectionOffsets[i];

            vert.x = mouse.position.x + offset.x; // Update vertex position based on mouse position
            vert.y = mouse.position.y + offset.y; // Update vertex position based on mouse position
        }
    }


    // Call the applyConstraint method for each edge
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < rect.edges.length; j++) {
            rect.edges[j].applyConstraint();
        }
    }

    for (let i = 0; i < rect.vertex.length; i++) {
        const vert = rect.vertex[i];
        if (vert.isFixed) {
            continue; // Skip fixed vertices
        }
        const d = getDifference(vert, mouse.position);
        if (getLength(d) < mouse.radius) {
            vert.isSelected = true; // Deselect if outside mouse radius
            const overlapRatio = (mouse.radius - getLength(d)) / mouse.radius; // Calculate overlap ratio
            const offset = {
                x: d.x * overlapRatio,
                y: d.y * overlapRatio
            };
            vert.x += offset.x; // Update vertex position based on mouse position
            vert.y += offset.y; // Update vertex position based on mouse position
        }
        else {
            vert.isSelected = false; // Deselect if outside mouse radius
        }
    }
    draw();
}


function draw() {
    canvas.clear();
    canvas.context.strokeStyle = "white";
    canvas.context.fillStyle = "white";
    canvas.context.lineWidth = 2;

    // Draw Edges
    for (let i = 0; i < rect.edges.length; i++) {
        const edge = rect.edges[i];
        const vert1 = edge.vert1;
        const vert2 = edge.vert2;
        canvas.context.beginPath();
        canvas.context.moveTo(vert1.x, vert1.y);
        canvas.context.lineTo(vert2.x, vert2.y);
        canvas.context.stroke();
    }

    // Draw Vertices
    if (true) {
        for (let i = 0; i < rect.vertex.length; i++) {
            const vert = rect.vertex[i];
            canvas.context.fillStyle = vert.isFixed ? "red" : "white";
            if (vert.isSelected) {
                canvas.context.fillStyle = "green"; // Highlight selected vertices
            }
            canvas.context.beginPath();
            canvas.context.arc(vert.x, vert.y, 4, 0, 2 * Math.PI);
            canvas.context.fill();
        }
    }

    // Draw Mouse Position
    canvas.context.fillStyle = "rgba(0,255,0,0.3)";
    canvas.context.beginPath();
    canvas.context.arc(mouse.position.x, mouse.position.y, mouse.radius, 0, 2 * Math.PI);
    canvas.context.fill();
    // Draw Mouse Cut Radius
    canvas.context.fillStyle = "rgba(255,0,0,0.3)";
    canvas.context.beginPath();
    canvas.context.arc(mouse.position.x, mouse.position.y, mouse.cutRadius, 0, 2 * Math.PI);
    canvas.context.fill();
}

function run() {
    time.update();
    update();
    draw();
    requestAnimationFrame(run);
}

function start() {
    time.frame = performance.now();
    run();
}

// start
start();