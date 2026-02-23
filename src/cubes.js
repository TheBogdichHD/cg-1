"use strict";

const vertexShaderSource = `#version 300 es
    in vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
        gl_Position = u_matrix * a_position;
    }
`;
const fragmentShaderSource = `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    out vec4 outColor;
    void main() {
        outColor = u_color;
    }
`;


function createCubePositions() {
    return new Float32Array([
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ]);
}

function createCubeIndices() {
    return new Uint16Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23  // left
    ]);
}

function main() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    const program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const matrixLoc = gl.getUniformLocation(program, "u_matrix");
    const colorLoc = gl.getUniformLocation(program, "u_color");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positions = createCubePositions();
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    const indices = createCubeIndices();
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const podiumCenter = [0, 0, 8];
    const cubes = [
        { pos: [-6, 0, 2], size: 1, color: [1, 1, 0] },
        { pos: [-2, 0, 2], size: 1, color: [0.75, 0.75, 0.75] },
        { pos: [2, 0, 2], size: 1, color: [0.4, 0.2, 0.1] },
        { pos: [6, 0, 2], size: 1, color: [0, 0, 0] }
    ];


    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    let cubeAngles = [0, 0, 0, 0];
    let podiumAngle = 0;
    let worldAngle = 0;

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    function drawScene(now) {
        if (keys['1']) {
            cubeAngles[0] -= 1;
            cubeAngles[1] -= 1;
            cubeAngles[2] -= 1;
            cubeAngles[3] -= 1;
        }
        if (keys['2']) podiumAngle -= 1;
        if (keys['3']) worldAngle -= 1;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clearColor(0.1, 0.1, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(vao);
        gl.useProgram(program);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(degToRad(90), aspect, 0.1, 2000);
        const cameraMatrix = m4.lookAt([0, 10, 30], [0, 0, 0], [0, 1, 0]);
        var viewMatrix = m4.inverse(cameraMatrix);
        const viewProjection = m4.multiply(projection, viewMatrix);

        cubes.forEach((cube, i) => {
            let cubeLocal = m4.identity();
            cubeLocal = m4.translate(cubeLocal, ...cube.pos);
            cubeLocal = m4.translate(cubeLocal, -cube.size / 2, -cube.size / 2, -cube.size / 2);
            cubeLocal = m4.scale(cubeLocal, cube.size, cube.size, cube.size);
            cubeLocal = m4.yRotate(cubeLocal, degToRad(cubeAngles[i]));

            let podiumMatrix = m4.yRotate(m4.translate(m4.identity(), ...podiumCenter), degToRad(podiumAngle));

            let worldMatrix = m4.yRotate(m4.identity(), degToRad(worldAngle));

            let cubeMatrix = m4.multiply(worldMatrix, podiumMatrix);
            cubeMatrix = m4.multiply(cubeMatrix, cubeLocal);

            const finalMatrix = m4.multiply(viewProjection, cubeMatrix);
            gl.uniformMatrix4fv(matrixLoc, false, finalMatrix);
            gl.uniform4f(colorLoc, ...cube.color, 1);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        });

        requestAnimationFrame(drawScene);
    }

    requestAnimationFrame(drawScene);
}

main();